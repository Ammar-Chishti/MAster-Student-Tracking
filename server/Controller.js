const sequelize = require('../sequelize/connection.js');
const { Op } = require('sequelize');
const models = require('../sequelize/models.js');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const scrape = require('./scrape.js');
const checkRequirements = require('./checkRequirements.js');
const suggest = require('./suggestCoursePlan.js');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { SignJWT } = require('jose/jwt/sign');
const { jwtVerify } = require('jose/jwt/verify');
const nodemailer = require('nodemailer');

class Controller {
  // get the correct sequelize model given its name as a string
  static async switchModel (modelString) {
    let m;
    switch (modelString.toLowerCase()) {
      case 'course': m = models.Course; break;
      case 'courseoffering': m = models.CourseOffering; break;
      case 'courseplan': m = models.CoursePlan; break;
      case 'degreerequirement': m = models.DegreeRequirement; break;
      case 'student': m = models.Student; break;
      case 'user': m = models.User; break;
      default: m = undefined; break;
    }
    return m;
  }

  // attempt to login, fields used are body.email and body.password
  static async login (body) {
    // failed result
    const result = { success: false, sbu_id: '-1', isGPD: false, jwt: '-1' };

    // find user in database
    const user = await models.User.findOne({
      where: { email: body.email }
    });

    // user not found
    if (user === null) {
      return result;
    }

    // compare password (bcrypt salt+hash used)
    const passwordMatch = await bcrypt.compare(body.password, user.hashedPassword);

    // return success, with a new token
    if (passwordMatch) {
      result.success = true;
      result.sbu_id = user.sbu_id;
      result.isGPD = user.isGPD;
      result.jwt = await Controller.generateToken(user.sbu_id, user.isGPD);
      console.log(result);
    }
    return result;
  }

  // random server secret, static value is used for simplicity
  static async getSecret () {
    return await crypto.createSecretKey(
      'NxMy0UvkVOuci0HK4sciVCrhVOJP6AG8neQeWVBCJeiXPo6dsXwFYOuw2SETWrLnpDVRXZuk');
  }

  // generate a new signed JWT token
  static async generateToken (id, isGPD) {
    const jwt = await new SignJWT({ sbu_id: id, isGPD: isGPD })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(await Controller.getSecret());
    return jwt;
  }

  // authenticate a previously generated JWT token
  static async authenticate (cookies) {
    const result = { success: false, sbu_id: '-1', isGPD: false, jwt: cookies.jwt };

    const { payload } = await jwtVerify(cookies.jwt, await Controller.getSecret(), {
      alg: 'HS256'
    }).catch(() => { // token error, payload will be undefined
      return result;
    });

    if (payload === undefined) { // treat token errors as a failure to authenticate
      return result;
    } else {
      // if token is valid, make sure the user actually exists
      const user1 = await models.User.findByPk(payload.sbu_id);
      if (user1 === null) {
        return result;
      }
      // return success
      result.success = true;
      result.sbu_id = payload.sbu_id;
      result.isGPD = payload.isGPD;
      result.department = user1.department;
      return result;
    }
  }

  // handle all import/scrape cases
  static async import (file, type, query) {
    if (file === undefined) {
      return { total: 0, failed: 0, type: 'no file provided' };
    }
    let f;
    switch (type.toLowerCase()) {
      case 'course': f = Controller.importCourse; break;
      case 'courseoffering': f = Controller.importCourseOffering; break;
      case 'courseplan': f = Controller.importCoursePlan; break;
      case 'degreerequirement': f = Controller.importDegreeRequirement; break;
      case 'student': f = Controller.importStudent; break;
      case 'grade': f = Controller.importGrade; break;
      default: return { total: 0, failed: 0, type: 'import not allowed' };
    }

    console.log(query); // indicates department of GPD
    query.waived = 'waived'; // always waive prerequisites on import

    const importResults = await f(file, query);

    console.log(importResults);

    return importResults;
  }

  // parse CSV into a list of objects
  static async parseCSV (path, type) {
    const fileContents = fs.readFileSync(path).toString();

    let columns;
    switch (type) {
      case 'student':
        columns = ['sbu_id', 'first_name', 'last_name', 'email', 'department', 'track',
          'entry_semester', 'entry_year', 'requirement_version_semester', 'requirement_version_year',
          'graduation_semester', 'graduation_year', 'password'];
        break;
      case 'courseoffering':
        columns = ['department', 'course_num', 'section', 'semester', 'year', 'timeslot'];
        break;
      case 'courseplan':
        columns = ['sbu_id', 'department', 'course_num', 'section', 'semester', 'year', 'grade'];
        break;
      default:
        columns = true;
        break;
    }

    let records;
    try {
      records = await parse(fileContents, {
        // columns: columns,
        columns: header => columns, // ignore file headers and use specific columns
        skip_empty_lines: true,
        skip_lines_with_error: true // invalid lines are skipped
      });
    } catch (err) {
      console.log(err);
      return [];
    }
    return records;
  }

  // scrapes file and inserts entries into database
  // input: txt file (from pdf conversion)
  // query: specifies department(s), semester, and year
  static async importCourse (file, query) {
    const fileContents = fs.readFileSync(file.path).toString();
    const departments = query.departments.split(',').map(d => d.trim().toUpperCase()).filter(v => v.length > 0);
    const courses = scrape(fileContents, departments);
    const count = { total: 0, failed: 0, type: 'import course', failedList: [] };
    // [{errorMessage: "", errorEntry:object}]

    // validate courses from the output of scrape(...)
    const validated = [];
    for (const c of courses) {
      count.total += 1;
      c.semester = query.semester; // get semester and year from query
      c.year = query.year;
      c.description = ''; // description is unneeded

      // assign prereqs
      c.prereqs = JSON.stringify(c.prereqs);

      // actual validation step using sequelize's instance.validate()
      const instance = await models.Course.build(c).validate().catch(function (error) {
        console.log(error.name);
        console.log(c);
        count.failed += 1;
        count.failedList.push(
          { errorMessage: 'Validation error', errorEntry: c }
        );
        return null;
      });
      if (instance !== null) {
        validated.push(c);
      }
    }
    // bulk create on validated instances, substantially faster than individual inserts
    models.Course.bulkCreate(validated, { ignoreDuplicates: true, returning: true })
      .then(async () => { // unfortunately the result from bulkinsert only has auto-ids from upserts
        // so we have to requery everything here
        const result = await models.Course.findAll({
          where: {
            semester: query.semester,
            year: query.year
          }
        });
        // console.log(result);

        // fix course offerings that might have old descriptions
        let offerings = await models.CourseOffering.findAll({
          where: {
            oldDescription: true,
            semester: query.semester,
            year: query.year
          }
        });

        // find all course plan entries that might have become invalid
        let entries = await models.CoursePlan.findAll({
          where: {
            semester: query.semester,
            year: query.year,
            validity: 2
          }
        });

        if (departments.length > 0) {
          offerings = offerings.filter(v => departments.indexOf(v.department) >= 0);
          entries = entries.filter(v => departments.indexOf(v.department) >= 0);
        }

        // mark entries invalid
        for (const r of entries) {
          const search1 = result.filter(v => v.department === r.department && v.course_num === r.course_num);
          if (search1.length === 0) {
            r.course_offering_id = null;
            r.validity = 0;
          } else {
            r.prereqs = search1[0].prereqs;
            if (await Controller.hasPrerequisiteConflict(r)) {
              r.validity = 0;
            }
          }
          r.save();
        }

        for (const o of offerings) {
          // if course description was just imported for this offering, update id
          const search1 = result.filter(v => v.department === o.department)
            .filter(v => v.course_num === o.course_num);
          if (search1.length > 0) {
            // console.log(search1[0]);
            o.course_id = search1[0].course_id;
            o.credits = search1[0].credits;
            o.prereqs = search1[0].prereqs;
            o.repeatable = search1[0].repeatable;
            o.oldDescription = false;
            o.save();

            // mark entries that are made valid
            const nowValid = entries.filter(v => v.course_num === o.course_num)
              .filter(v => v.department === o.department)
              .filter(v => parseInt(v.section) === parseInt(o.section));
            for (const entry of nowValid) {
              entry.course_offering_id = o.course_offering_id;
              entry.credits = o.credits;
              entry.timeslot = o.timeslot;
              entry.validity = 1;
              entry.prereqs = o.prereqs;
              entry.save();
            }
          } else {
            Controller.deleteByID('courseoffering', o.course_offering_id);
          }
        }
      });

    // return count of failed / total courses
    return count;
  }

  // input csv: department,course_num,section,semester,year,timeslot
  static async importCourseOffering (file, query) {
    const offerings = await Controller.parseCSV(file.path, 'courseoffering');
    const count = { total: 0, failed: 0, type: 'import course offering', failedList: [] };

    // get all semesters that have been imported
    let semesterYears = await sequelize.query('SELECT DISTINCT semester, year FROM Courses');
    semesterYears = semesterYears[0].map(row => row.semester + row.year);

    // fetch all courses
    const courses = await models.Course.findAll({
      attributes: ['course_id', 'department', 'course_num', 'semester', 'year', 'credits']
    });

    const validated = [];
    for (const o of offerings) {
      count.total += 1;

      // only allow import within same department
      if (query.department !== o.department) {
        count.failed += 1;
        console.log('Cannot import from other department ' + o.department);
        console.log(o);
        count.failedList.push(
          { errorMessage: 'Cannot import from other department ' + o.department, errorEntry: o }
        );
        continue;
      }

      // find and associate this offering with its course description
      // search1: get courses that match department + number
      const search1 = courses.filter(v => v.department === o.department && v.course_num === o.course_num);
      if (search1.length > 0) {
        // search2: get courses that also match semester + year
        const search2 = search1.filter(v => v.semester === o.semester && v.year.toString() === o.year);
        if (search2.length > 0) {
          o.course_id = search2[0].course_id;
          o.credits = search2[0].credits;
          o.prereqs = search2[0].prereqs;
          o.repeatable = search2[0].repeatable;
          // handle case where no matching description exists but an older one can be used
        } else if (semesterYears.indexOf(o.semester + o.year) < 0) {
          o.course_id = search1[0].course_id;
          o.credits = search1[0].credits;
          o.prereqs = search1[0].prereqs;
          o.repeatable = search1[0].repeatable;
          o.oldDescription = true;
        } else {
          count.failed += 1;
          console.log('Associated course not found for offering:');
          console.log(o);
          count.failedList.push(
            { errorMessage: 'Associated course not found for offering', errorEntry: o }
          );
          continue;
        }
      } else {
        count.failed += 1;
        console.log('Associated course not found for offering:');
        console.log(o);
        count.failedList.push(
          { errorMessage: 'Associated course not found for offering', errorEntry: o }
        );
        continue;
      }

      // default section to 1
      if (o.section === '') o.section = 1;

      // validate instances
      const instance = await models.CourseOffering.build(o).validate().catch(function (error) {
        console.log(error.name);
        console.log(o);
        count.failed += 1;
        count.failedList.push(
          { errorMessage: 'Validation error', errorEntry: o }
        );
        return null;
      });
      if (instance !== null) {
        validated.push(o);
      }
    }

    // bulk insert for heavy speedup
    models.CourseOffering.bulkCreate(validated, { ignoreDuplicates: true, returning: true })
      .then(async () => { // unfortunately the result from bulkinsert only has auto-ids from upserts
        // so we have to requery everything here
        const result = await models.CourseOffering.findAll();

        // console.log(result);
        // mark course plan entries valid
        const coursePlanEntries = await models.CoursePlan.findAll({
          where: {
            validity: 2
          }
        });

        for (const r of coursePlanEntries) {
          const search1 = result.filter(v => v.department === r.department)
            .filter(v => v.course_num === r.course_num)
            .filter(v => v.semester === r.semester)
            .filter(v => v.year.toString() === r.year.toString())
            .filter(v => parseInt(v.section) === parseInt(r.section));

          if (search1.length > 0) {
            // console.log(search1);
            r.course_offering_id = search1[0].course_offering_id;
            r.credits = search1[0].credits;
            r.validity = search1[0].oldDescription ? 2 : 1;
            r.prereqs = search1[0].prereqs;
            r.timeslot = search1[0].timeslot;

            // if timeslot is conflicting, mark invalid
            if (await Controller.hasTimeConflict(r)) {
              r.validity = 0;
              r.timeConflict = true;
            }
            r.save();
            continue;
          }
        }
      });
    return count;
  }

  // input csv: sbu_id,department,course_num,section,semester,year,grade
  static async importCoursePlan (file, query) {
    const records = await Controller.parseCSV(file.path, 'courseplan');
    query.waived = 'waived';
    return Controller.importCoursePlanWrapped(records, query);
  }

  // wrapped function, so we can use this for both importing and adding individual entries
  static async importCoursePlanWrapped (records, query) {
    const count = { total: 0, failed: 0, type: 'import course plan', failedList: [] };

    // get all semesters that have been imported
    let semesterYears = await sequelize.query('SELECT DISTINCT semester, year FROM Courses');
    semesterYears = semesterYears[0].map(row => row.semester + row.year);

    // fetch all courses
    const courses = await models.Course.findAll();

    // fetch all course offerings
    const courseOfferings = await models.CourseOffering.findAll();

    // get all student ids
    let students = await models.Student.findAll({ attributes: ['sbu_id', 'department'] });

    students = students.filter(v => v.department === query.department).map(v => v.sbu_id);

    for (const r of records) {
      count.total += 1;

      if (query.waived !== 'waived') {
        query.waived = r.waived;
      }
      console.log(query.waived);
      if (r.transfer) {
        query.waived = 'waived';
        r.validity = 1;
        r.semester = 'Winter';
        r.year = 1901;
        r.section = Math.ceil(Math.random() * 10000000) + 10000000;
        r.prereqs = JSON.stringify([]);
        if (!r.department && !r.course_num) {
          r.department = 'N/A';
          r.course_num = 'N/A';

          const result = await Controller.addCoursePlanEntry(r, query.waived);
          if (!result.success) {
            count.failed += 1;
            count.failedList.push(
              { errorMessage: result.errorMessage, errorEntry: r }
            );
          }
          continue;
        }
      }

      console.log(r);

      // check that student actually exists
      if (students.indexOf(r.sbu_id) < 0) {
        count.failed += 1;
        console.log('Associated student does not exist or is not in department:');
        console.log(r);
        count.failedList.push(
          { errorMessage: 'Associated student does not exist or is not in department', errorEntry: r }
        );
        continue;
      }

      // case 1: course offering exists
      const search1 = courseOfferings
        .filter(v => v.department === r.department)
        .filter(v => v.course_num === r.course_num)
        .filter(v => v.semester === r.semester)
        .filter(v => v.year.toString() === r.year.toString())
        .filter(v => parseInt(v.section) === parseInt(r.section));

      if (search1.length > 0) {
        r.course_offering_id = search1[0].course_offering_id;
        r.credits = search1[0].credits;
        r.validity = search1[0].oldDescription ? 2 : 1;
        r.prereqs = search1[0].prereqs;
        r.timeslot = search1[0].timeslot;

        const result = await Controller.addCoursePlanEntry(r, query.waived);
        if (!result.success) {
          count.failed += 1;
          count.failedList.push(
            { errorMessage: result.errorMessage, errorEntry: r }
          );
        }
        continue;
      }

      // case 2: course offering does not exist but course description exists
      const search2 = courses
        .filter(v => v.department === r.department)
        .filter(v => v.course_num === r.course_num);
      const search3 = search2
        .filter(v => v.semester === r.semester)
        .filter(v => v.year.toString() === r.year);

      if (search3.length > 0) {
        r.course_offering_id = null;
        r.credits = search3[0].credits;
        r.prereqs = search3[0].prereqs;
        r.validity = 2; // temporarily valid

        const result = await Controller.addCoursePlanEntry(r, query.waived);
        if (!result.success) {
          count.failed += 1;
          count.failedList.push(
            { errorMessage: result.errorMessage, errorEntry: r }
          );
        }
        continue;
      }

      // case 3: course description exists in a different semester/year
      //         AND descriptions have not been imported for this semester/year
      if (search2.length > 0 && semesterYears.indexOf(r.semester + r.year) < 0) {
        r.course_offering_id = null;
        r.credits = search2[0].credits;
        r.prereqs = search2[0].prereqs;
        r.validity = 2; // temporarily valid

        const result = await Controller.addCoursePlanEntry(r, query.waived);
        if (!result.success) {
          count.failed += 1;
          count.failedList.push(
            { errorMessage: result.errorMessage, errorEntry: r }
          );
        }
        continue;
      }

      console.log(semesterYears);
      // console.log(search1);
      // console.log(search2);
      // console.log(search3);

      // case 4: neither course offering nor description exists
      count.failed += 1;
      console.log('Associated course offering and description does not exist:');
      console.log(r);
      count.failedList.push(
        { errorMessage: 'Associated course offering and description does not exist', errorEntry: r }
      );
      continue;
    }
    return count;
  }

  // add entry to course plan, handling all validation and time conflicts
  static async addCoursePlanEntry (entry, type) {
    if (await Controller.hasTimeConflict(entry)) {
      console.log('Time conflict');
      console.log(entry);
      return { success: false, errorMessage: 'Invalid course plan entry due to time conflict' };
    }

    if (type !== 'waived' && await Controller.hasPrerequisiteConflict(entry)) {
      console.log('Prerequisites not satisfied');
      console.log(entry);
      return { success: false, errorMessage: 'Invalid course plan entry due to unsatisfied prerequisite' };
    }

    const status = await Controller.post('courseplan', entry);
    return { success: status === 200, errorMessage: 'Validation error' };
  }

  static async hasPrerequisiteConflict (entry) {
    const entries = await models.CoursePlan.findAll({
      where: {
        sbu_id: entry.sbu_id
      }
    });

    const prereqs = JSON.parse(entry.prereqs);
    const semesters = ['Winter', 'Spring', 'SummerI', 'SummerII', 'Fall'];

    for (const preq of prereqs) {
      const satisfiedBy = entries
        .filter(v => preq.indexOf(v.department + ' ' + v.course_num) >= 0)
        .filter(v => parseInt(v.year) < parseInt(entry.year) ||
          (parseInt(v.year) === parseInt(entry.year) &&
            semesters.indexOf(v.semester) < semesters.indexOf(entry.semester)));
      // console.log(satisfiedBy);
      if (satisfiedBy.length === 0) {
        // console.log(prereqs);
        return true;
      }
    }

    return false;
  }

  static async hasTimeConflict (entry) {
    if (entry.course_offering_id === null || entry.timeslot === '') {
      return false;
    }
    // get possibly conflicting course plan entries
    const entries = await models.CoursePlan.findAll({
      where: {
        sbu_id: entry.sbu_id,
        semester: entry.semester,
        year: entry.year,
        course_offering_id: {
          [Op.ne]: null // where not null
        }
      }
    });

    // check for overlapping timeslots
    const timeslots = entries.map(v => v.timeslot);
    console.log(timeslots);

    for (const t of timeslots) {
      if (t === '') return false;

      const days1 = entry.timeslot.split(' ')[0];
      const times1 = entry.timeslot.split(' ')[1];
      const days2 = t.split(' ')[0];
      const times2 = t.split(' ')[1];

      for (const day of ['M', 'TU', 'W', 'TH', 'F']) {
        if (days1.indexOf(day) >= 0 && days2.indexOf(day) >= 0) {
          if (await Controller.isTimeOverlap(times1, times2)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  static async isTimeOverlap (t1, t2) {
    const t1start = await Controller.timeStrToInt(t1.split('-')[0]);
    const t1end = await Controller.timeStrToInt(t1.split('-')[1]);
    const t2start = await Controller.timeStrToInt(t2.split('-')[0]);
    const t2end = await Controller.timeStrToInt(t2.split('-')[1]);

    if (t1start <= t2start && t2start <= t1end) {
      return true;
    }
    if (t2start <= t1start && t1start <= t2end) {
      return true;
    }

    return false;
  }

  static async timeStrToInt (t1) {
    if (t1.length === 6) t1 = '0' + t1;
    return (parseInt(t1.slice(0, 2)) % 12) * 60 +
      parseInt(t1.slice(3, 5)) +
      (t1.slice(5, 7) === 'PM' ? 720 : 0);
  }

  // import degree requirement using .json file in our own format
  // if the entire degree requirement cannot be added successfully, changes are reverted
  static async importDegreeRequirement (file, query) {
    const json = fs.readFileSync(file.path).toString();

    let requirementObj;
    let requirements;
    try {
      requirementObj = await JSON.parse(json);
      requirements = JSON.stringify(requirementObj.requirements);
      requirementObj.requirements = requirements;
    } catch {
      // JSON parse failure
      return {
        total: 1,
        failed: 1,
        type: 'import degree requirement',
        failedList: [{ errorMessage: 'JSON parse failed', errorEntry: 'N/A' }]
      };
    }

    // only allow import within same department
    if (query.department !== requirementObj.department) {
      console.log('Cannot import from other department ' + requirementObj.department);
      console.log(requirementObj);
      return {
        total: 1,
        failed: 1,
        type: 'import degree requirement',
        failedList: [{ errorMessage: 'Cannot import from other department: ' + requirementObj.department, errorEntry: requirementObj.track }]
      };
    }

    // attempt to create new degree requirement, exiting on failure
    const degReq = await models.DegreeRequirement.upsert(requirementObj).catch((err) => {
      console.log('Failed to create degree requirement:');
      console.log(err.name);
      console.log(requirementObj);
      return null;
    });
    if (degReq === null) {
      return {
        total: 1,
        failed: 1,
        type: 'import degree requirement',
        failedList: [{ errorMessage: 'Failed to create degree requirement: ' + requirementObj.department, errorEntry: requirementObj.track }]
      };
    }

    return { total: 1, failed: 0, type: 'import degree requirement', failedList: [] };
  }

  // csv file containing student data:
  // sbu_id,first_name,last_name,email,department,track,entry_semester,entry_year,
  // requirement_version_semester,requirement_version_year,graduation_semester,graduation_year,password
  static async importStudent (file, query) {
    const students = await Controller.parseCSV(file.path, 'student');
    const count = { total: 0, failed: 0, type: 'import student', failedList: [] };

    // delete all students in department
    await models.User.destroy({
      where: {
        isGPD: false,
        department: query.department
      },
      truncate: { cascade: true }
    });

    const validated = [];
    for (const s of students) {
      count.total += 1;

      // only allow import within same department
      if (query.department !== s.department) {
        count.failed += 1;
        console.log('Cannot import from other department ' + s.department);
        console.log(s);
        count.failedList.push(
          { errorMessage: 'Cannot import from other department ' + s.department, errorEntry: s }
        );
        continue;
      }

      // salted + hashed password
      s.hashedPassword = await Controller.genHash(s.password);

      // validate user and student instances
      const user = await models.User.build(s).validate().catch(function (error) {
        console.log(error.name);
        console.log(s);
        count.failed += 1;
        count.failedList.push(
          { errorMessage: 'Validation error', errorEntry: s }
        );
        return null;
      });
      const student = await models.Student.build(s).validate().catch(function (error) {
        console.log(error.name);
        console.log(s);
        count.failed += 1;
        count.failedList.push(
          { errorMessage: 'Validation error', errorEntry: s }
        );
        return null;
      });

      if (user !== null && student !== null) {
        validated.push(s);
      }
    }

    await models.User.bulkCreate(validated, { ignoreDuplicates: true });
    await models.Student.bulkCreate(validated, { ignoreDuplicates: true });
    return count;
  }

  // import grades, same format as course plan
  // only adds grades to course plan entries that already exist
  // input csv: sbu_id,department,course_num,section,semester,year,grade
  static async importGrade (file, query) {
    const records = await Controller.parseCSV(file.path, 'courseplan');
    const count = { total: 0, failed: 0, type: 'import grades', failedList: [] };

    // get all course plan entries
    const entries = await models.CoursePlan.findAll();

    const validated = [];
    for (const r of records) {
      count.total += 1;

      // only allow import within same department
      if (query.department !== r.department) {
        count.failed += 1;
        console.log('Cannot import grade for department ' + r.department);
        console.log(r);
        count.failedList.push(
          { errorMessage: 'Cannot import grade for department ' + r.department, errorEntry: r }
        );
        continue;
      }

      // search for entry being updated
      const search = entries.filter(v => v.sbu_id === r.sbu_id)
        .filter(v => v.department === r.department)
        .filter(v => v.course_num === r.course_num)
        .filter(v => v.semester === r.semester)
        .filter(v => v.year.toString() === r.year);

      if (search.length === 0) {
        console.log('Failed to find existing course plan entry');
        console.log(r);
        count.failed += 1;
        count.failedList.push(
          { errorMessage: 'Failed to find existing course plan entry', errorEntry: r }
        );
        continue;
      } else {
        const newEntry = search[0];
        newEntry.grade = r.grade;
        validated.push(newEntry.dataValues);
      }
    }

    await models.CoursePlan.bulkCreate(validated, {
      updateOnDuplicate: ['grade']
    });
    return count;
  }

  // return a list of all values from the table specified by whatToGet
  // query can be used to filter out specific columns
  static async getAll (whatToGet, query) {
    const model = await Controller.switchModel(whatToGet);
    if (model === undefined) {
      return [];
    }

    // only extract fields from query that match an actual field of the model
    const queryModel = {};
    for (const key of Object.keys(model.rawAttributes)) {
      if (query[key]) {
        queryModel[key] = query[key];
      }
    }

    let result;
    if (query.associate === 'true') {
      result = await model.findAll({
        where: queryModel,
        include: { all: true }
      });
    } else {
      result = await model.findAll({
        where: queryModel
      });
    }

    // TODO this is inefficient
    // in the case of getting all students, also get the degree status
    if (whatToGet.toLowerCase() === 'student') {
      for (const student of result) {
        Object.assign(student.dataValues, await Controller.getStudentStatus(student.dataValues.sbu_id));
      }
    }
    return result;
  }

  // get a single entry by primary key
  static async getByID (whatToGet, id, query) {
    const model = await Controller.switchModel(whatToGet);
    if (model === undefined) {
      return {};
    }
    if (query.associate === 'true') {
      const search = await model.findByPk(id, { include: { all: true } });
      return search || {};
    } else {
      const search = await model.findByPk(id);
      return search || {};
    }
  }

  // check if body.email is unique in database
  static async uniqueEmail (body) {
    const user = await models.User.findOne({
      where: { email: body.email }
    });
    if (user === null) {
      return 200;
    } else {
      return 202;
    }
  }

  // get all course plan entries for the specified student id
  static async getCoursePlanByID (id) {
    const records = await models.CoursePlan.findAll({
      where: { sbu_id: id }
      // include: { all: true }
    });

    for (const r of records) {
      if (r.transfer) {
        r.dataValues.SemesterYear = 'Transfer Credit';
        r.dataValues.section = 0;
      } else {
        r.dataValues.SemesterYear = r.semester + ' ' + r.year;
      }
    }
    return records;
  }

  // get the degree status / course plan status for specified student
  static async getStudentStatus (id) {
    const student = await models.Student.findByPk(id);

    if (student === null) {
      return { requirementsStatus: 'Student not found' };
    }

    const degree = await models.DegreeRequirement.findOne({
      where: {
        department: student.department,
        track: student.track,
        semester: student.requirement_version_semester,
        year: student.requirement_version_year
      }
    });

    const notFound = {
      department: student.department,
      track: student.track,
      requirementsStatus: 'Not Found',
      details: []
    };

    if (degree == null) {
      return notFound;
    }

    try {
      degree.requirements = await JSON.parse(degree.requirements);
    } catch {
      return notFound;
    }

    const coursePlan = await models.CoursePlan.findAll({
      where: { sbu_id: id }
    });

    const coursePlanNoInvalid = coursePlan.filter(v => v.validity !== 0);
    const coursePlanInvalid = coursePlan.filter(v => v.validity === 0);
    // checkRequrements.js is a seperate module for requirement checking
    const result = await checkRequirements(degree, coursePlanNoInvalid, student.proficiency);

    if (coursePlanInvalid.length > 0) {
      result.coursePlanStatus = 'Invalid';
    }
    if (student.graduated) {
      result.requirementsStatus = 'Graduated';
    }

    return result;
  }

  // add a student (including the associated user)
  static async postStudent (body) {
    // check if student already exists
    if (body.sbu_id === undefined) {
      body.sbu_id = Math.ceil(Math.random() * 10000000) + 10000000;
    } else {
      const checkIfExisting = await models.Student.findByPk(body.sbu_id);
      if (checkIfExisting !== null) {
        return 409;
      }
    }

    // salted + hashed password
    body.hashedPassword = await Controller.genHash(body.password);

    // create user
    let status = await Controller.post('user', body);
    if (status !== 200) {
      return status;
    }

    // create student
    status = 200;
    await models.Student.create(body).catch((err) => {
      console.log(err);
      console.log(err.name);
      console.log(body);
      status = 409;
    });

    // if user is successfully created but student fails, revert by deleting user
    if (status !== 200) {
      await Controller.deleteByID('user', body.sbu_id);
    }
    return status;
  }

  // edit a student / the associated user
  static async putStudent (id, body) {
    const student1 = await models.Student.findByPk(id);

    if (student1 === null) {
      return 404; // not found
    }
    const user1 = await models.User.findByPk(id);

    // check timestamps (in case of concurrent edits)
    console.log('timestamp old: ' + student1.updatedAt.toISOString());
    console.log('timestamp new: ' + body.updatedAt);
    if ((student1.updatedAt.toISOString() !== body.updatedAt) ||
      (user1.updatedAt.toISOString() !== body.User.updatedAt)) {
      if (body.ignoreTimeStamp) {
        console.log(body);
      } else {
        return 403;
      }
    }
    body.updatedAt = new Date();

    // if password is non-null/non-undefined/non-empty
    if (body.password) {
      console.log('New password: ', body.password);
      body.hashedPassword = await Controller.genHash(body.password);
    }

    // update both user and student
    let status = 200; // success
    await user1.update(body).catch((err) => {
      console.log(err.name);
      console.log(body);
      status = 409; // conflict
    });
    await student1.update(body).catch((err) => {
      console.log(err.name);
      console.log(body);
      status = 409; // conflict
    });
    return status;
  }

  static async putComment (id, body) {
    const student1 = await models.Student.findByPk(id, {
      include: { all: true }
    });

    if (student1 === null) {
      return 404; // not found
    }
    let status = 200;
    await student1.update(body).catch((err) => {
      console.log(err.name);
      console.log(body);
      status = 409; // conflict
    });

    if (status === 200 && body.sendEmail) {
      const message = 'Notification from GPD: You have the following new comment:\n\n' + body.newComment;
      const address = student1.User.email;
      Controller.sendEmail(message, address);
    }

    return status;
  }

  static async sendEmail (message, address) {
    console.log(message);
    console.log(address);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'MastSystemNoReply@gmail.com',
        pass: 'L#MlleZ?I-+#U~P<NVJ+{$=1'
      }
    });

    const mailOptions = {
      from: 'MastSystemNoReply@gmail.com',
      to: address,
      subject: 'MAST System Notification',
      text: message
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }

  // add a new resource to database (eg. course, courseoffering, courseplan)
  static async post (whatToPost, body) {
    const model = await Controller.switchModel(whatToPost);
    if (model === undefined) {
      return 400; // bad request
    }

    // for new users without a specified id, randomly create one
    if (whatToPost.toLowerCase() === 'user' && body.sbu_id === undefined) {
      body.sbu_id = Math.ceil(Math.random() * 10000000) + 10000000;
    }

    // insert into database
    let status = 200; // success
    await model.create(body).catch((err) => {
      console.log(err);
      console.log(body);
      status = 409; // conflict
    });
    return status;
  }

  // edit a resource
  static async put (whatToPut, id, body) {
    const model = await Controller.switchModel(whatToPut);
    if (model === undefined) {
      return 400; // bad request
    }

    const instance = await model.findByPk(id);
    if (instance === null) {
      return 404; // not found
    }

    let status = 200; // success
    await instance.update(body).catch((err) => {
      console.log(err.name);
      console.log(body);
      status = 409; // conflict
    });
    return status;
  }

  // delete all resources
  static async deleteAll (whatToDelete, department) {
    const model = await Controller.switchModel(whatToDelete);
    if (model === undefined) {
      return 400; // bad request
    }

    // deleting students is the same as deleting non-GPDs from the User table
    if (whatToDelete.toLowerCase() === 'student') {
      let status = 200;
      await models.User.destroy({
        where: {
          isGPD: false,
          department: department
        },
        truncate: { cascade: true }
      }).catch((err) => {
        console.log(err);
        status = 400; // bad request
      });
      return status;
    }

    let status = 200; // success
    await model.destroy({
      truncate: { cascade: true }
    }).catch((err) => {
      console.log(err);
      status = 400; // bad request
    });
    return status;
  }

  // delete resource by primary key
  static async deleteByID (whatToDelete, id) {
    const model = await Controller.switchModel(whatToDelete);
    if (model === undefined) {
      return 400; // bad request
    }

    const instance = await model.findByPk(id);
    if (instance === null) {
      return 404; // not found
    }

    let status = 200; // success
    await instance.destroy({
      truncate: { cascade: true }
    }).catch((err) => {
      console.log(err);
      status = 400; // bad request
    });
    return status;
  }

  // hash the given password with a new salt
  static async genHash (password) {
    const salt = await bcrypt.genSalt(2);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  static async addProficiency (id, body) {
    // console.log(id);
    // console.log(body);

    const student = await models.Student.findByPk(id);
    if (student === null) {
      return 400;
    }

    const proficiency = JSON.parse(student.proficiency);
    student.proficiency = JSON.stringify(proficiency.concat(body.department + ' ' + body.course_num));

    let status = 200;
    student.save().catch((err) => {
      console.log(err);
      status = 400;
    });

    return status;
  }

  static async suggestCoursePlan (id, body) {
    body.sbu_id = id;
    if (!body.preferredCourses) {
      body.preferredCourses = '';
    }
    if (!body.avoidCourses) {
      body.avoidCourses = '';
    }
    body.preferredCourses = body.preferredCourses.split(',').map(v => v.trim());
    body.avoidCourses = body.avoidCourses.split(',').map(v => v.trim());
    return await suggest(body);
  }

  // reset the whole database and add some default GPDs
  static async reset () {
    // drop and remake tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    const hashedPassword = await Controller.genHash('password');
    // create four default GPD accounts
    await models.User.create({
      sbu_id: '1',
      first_name: 'AMS',
      last_name: 'Director',
      email: 'ams@stonybrook.edu',
      password: 'password',
      hashedPassword: hashedPassword,
      isGPD: true,
      department: 'AMS'
    });
    await models.User.create({
      sbu_id: '2',
      first_name: 'BMI',
      last_name: 'Director',
      email: 'bmi@stonybrook.edu',
      password: 'password',
      hashedPassword: hashedPassword,
      isGPD: true,
      department: 'BMI'
    });
    await models.User.create({
      sbu_id: '3',
      first_name: 'CSE',
      last_name: 'Director',
      email: 'cse@stonybrook.edu',
      password: 'password',
      hashedPassword: hashedPassword,
      isGPD: true,
      department: 'CSE'
    });
    await models.User.create({
      sbu_id: '4',
      first_name: 'ESE',
      last_name: 'Director',
      email: 'ese@stonybrook.edu',
      password: 'password',
      hashedPassword: hashedPassword,
      isGPD: true,
      department: 'ESE'
    });
    return 200;
  }
}

module.exports = Controller;
