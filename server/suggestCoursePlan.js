const models = require('../sequelize/models.js');
// const util = require('util');
const checkRequirements = require('./checkRequirements.js');

async function suggestCoursePlan (options) {
  console.log(options);

  // temporary hard coded options
  // options = {
  //   sbu_id: '16943828',
  //   maxPerSemester: { 'Spring 2021': 4, 'Fall 2021': 4, 'Spring 2022': 4, 'Fall 2022': 4 },
  //   extendSemester: { 'Spring 2023': 4 },
  //   extendSemesterName: 'Spring 2023',
  //   preferredCourses: ['CSE 501', 'CSE 502', 'CSE 503'],
  //   avoidCourses: ['CSE 504', 'CSE 505'],
  //   timeRangeStart: '07:00AM',
  //   timeRangeEnd: '09:00PM',
  //   smartSuggest: false,
  //   preferredOrder: true
  // };

  if (options.smartSuggest) {
    options.preferredCourses = [];
    options.avoidCourses = [];
  }

  // get student, degree requirement, course plan
  const student = await models.Student.findByPk(options.sbu_id);
  if (student === null) {
    return [];
  }
  const degree = await models.DegreeRequirement.findOne({
    where: {
      department: student.department,
      track: student.track,
      semester: student.requirement_version_semester,
      year: student.requirement_version_year
    }
  });
  if (degree == null) {
    return [];
  }
  try {
    degree.requirements = await JSON.parse(degree.requirements);
  } catch {
    return [];
  }
  const coursePlan = await models.CoursePlan.findAll({
    where: { sbu_id: options.sbu_id }
  });
  const coursePlanNoInvalid = coursePlan.filter(v => v.validity !== 0);

  // store degree and current course plan
  options.degree = degree;
  options.coursePlan = coursePlanNoInvalid;
  options.proficiency = student.proficiency;

  // get all relevant course offerings by semesters
  // remove avoid courses, remove courses outside timeRange
  const offerings = await models.CourseOffering.findAll();

  options.offerings = offerings
    .filter(o => options.maxPerSemester[o.semester + ' ' + o.year] ||
      options.extendSemester[o.semester + ' ' + o.year])
    .filter(o => options.avoidCourses.indexOf(o.department + ' ' + o.course_num) < 0)
    .filter(o => o.timeslot === '' || o.timeslot === undefined ||
      isTimeInRange(
        timeStrToInt(options.timeRangeStart),
        timeStrToInt(options.timeRangeEnd),
        timeStrToInt(o.timeslot.split(' ')[1].split('-')[0]),
        timeStrToInt(o.timeslot.split(' ')[1].split('-')[1])
      ));

  for (const o of options.offerings) {
    o.dataValues.SemesterYear = o.semester + ' ' + o.year;
    o.dataValues.sbu_id = options.sbu_id;
    o.dataValues.validity = 1;
    o.dataValues.pendingApproval = true;

    let score = options.preferredOrder ? options.preferredCourses.indexOf(o.department + ' ' + o.course_num) : 1;

    if (options.smartSuggest) {
      const coursePlanEntries = await models.CoursePlan.findAll();
      const popularOrder = sortByFrequency(coursePlanEntries
        .map(v => v.department + ' ' + v.course_num));
      score = popularOrder.indexOf(o);
    }

    if (score === -1) {
      o.score = 0;
    } else {
      o.score = score;
    }

    o.extendedSemester = o.semester + ' ' + o.year === options.extendSemesterName;
  }

  // return an arary of possible ways to extend the current course plans
  return await suggest(options);
}

async function suggest (options) {
  const finalResults = [];
  // console.log(options.offerings[0]);

  const degreeProgress = await checkRequirements(options.degree, options.coursePlan, options.proficiency);

  const unsatisfied = degreeProgress.details2.filter(v => v.status === 'Unsatisfied');
  const satisfyList = []; // list of what can be used to satisfy each respective unsatisfied requirement

  let handleCredits = false;
  let handleBMI592 = false;
  let handleBreadth = false;

  for (const u of unsatisfied) {
    switch (u.type) {
      // ignore
      case 'GPA':
        break;

      // handle separately
      case 'credits':
        handleCredits = true;
        break;
      case 'semesters':
        handleBMI592 = true;
        break;
      case 'breadth':
        handleBreadth = true;
        break;

      // need at least 1 from satisfyList
      case 'required':
      case 'elective':
      case 'lectures':
      // case 'breadth':
      case 'proficiency':
        satisfyList.push([u.satisfyList]);
        break;

      // need 1 of each in satisfyList
      case 'project':
        satisfyList.push(u.satisfyList.map(v => [v]));
        break;
      case 'thesis':
        satisfyList.push(u.satisfyList.map(v => [v]));
        satisfyList.push(u.satisfyList.map(v => [v]));
        break;

      default:
        break;
    }
  }

  options.filteredOfferings = options.offerings
    .filter(v => (flatten(satisfyList)).indexOf(v.department + ' ' + v.course_num) >= 0);
  options.departmentOfferings = options.offerings
    .filter(v => v.department === options.degree.department);

  console.log(satisfyList);
  // console.log(options.filteredOfferings);
  // console.log(options.departmentOfferings);

  // list of what offerings be used to satisfy each respective unsatisfied requirement
  const satisfyListOfferings = [].concat.apply([], satisfyList
    .map(a => a.map(b => options.filteredOfferings
      .filter(c => b.indexOf(c.department + ' ' + c.course_num) >= 0))));

  // console.log(util.inspect(satisfyListOfferings, { showHidden: false, depth: null }));
  // console.log(satisfyListOfferings[0]);

  for (const oList of satisfyListOfferings) {
    console.log(oList.length);
    if (oList.length === 0) {
      // no course offering exists that can satisfy this requirement
      return [];
    }
  }

  backtrackSearch(options, satisfyListOfferings, [], [], 0, satisfyListOfferings.length, finalResults);

  // sort finalResults by score
  finalResults.sort(scoreSort);

  if (handleCredits) {
    console.log('handle credits true');
  }

  if (handleBMI592) {
    for (const result of finalResults) {
      const uniqueSemesters = options.coursePlan.concat(result).map(c => c.semester + c.year).filter((v, i, a) => a.indexOf(v) === i);
      console.log(uniqueSemesters);
    }
  }

  // console.log(finalResults.map(a => a.map(b => b.department + b.course_num)));
  return finalResults.slice(0, 3);
}

function backtrackSearch (options, listChoices, result, used, depth, maxDepth, finalResults) {
  // console.log(finalResults.length);
  if (finalResults.length > 10) {
    // console.log("test");
    return;
  }
  if (depth >= maxDepth) {
    const candidateExtension = result.slice(0, result.length);
    if (checkForConflicts(options, candidateExtension)) {
      for (const res of finalResults) {
        const sorted1 = res.map(v => v.course_offering_id).sort((a, b) => a - b);
        const sorted2 = candidateExtension.map(v => v.course_offering_id).sort((a, b) => a - b);
        if (JSON.stringify(sorted1) === JSON.stringify(sorted2)) {
          return;
        }
      }
      finalResults.push(candidateExtension);
      console.log(result.map(v => v.department + v.course_num));
    }
  } else {
    for (const c of listChoices[depth]) {
      if (!c.repeatable && result
        .map(v => v.department + ' ' + v.course_num)
        .indexOf(c.department + ' ' + c.course_num) > 0) {
        continue;
      }

      if (used.indexOf(c.course_offering_id) < 0) {
        if (hasNoTimeConflict(c, result.slice(0, result.length), options.coursePlan)) {
          result.push(c);
          used.push(c.course_offering_id);
          backtrackSearch(options, listChoices, result, used, depth + 1, maxDepth, finalResults);
          result.pop();
          used.pop();
        }
      }
    }
  }
}

function checkForConflicts (options, extension) {
  // check for time, prerequisite, and semester course count conflicts
  const checkList = options.coursePlan.concat(extension);

  // max per semester
  const semesterCount = checkList.map(v => v.semester + ' ' + v.year);
  const frequency = {};
  semesterCount.forEach(function (value) { frequency[value] = 0; });
  semesterCount.forEach(function (value) { frequency[value] += 1; });

  // console.log(options.maxPerSemester);

  for (const sem of Object.keys(options.maxPerSemester)) {
    if (frequency[sem] > 7) {
      return false;
    }

    if (frequency[sem] > options.maxPerSemester[sem]) {
      return false;
    }
  }

  // time conflict

  // prerequisites

  return true;
}

function hasNoTimeConflict (entry, result, coursePlan) {
  // console.log(entry); console.log(result);
  const timeslots = result.concat(coursePlan)
    .filter(v => v.semester === entry.semester && v.year === entry.year)
    .map(v => v.timeslot);
  console.log(result.length);
  console.log(timeslots);
  console.log(entry.timeslot);

  for (const t of timeslots) {
    if (t === '') return true;

    const days1 = entry.timeslot.split(' ')[0];
    const times1 = entry.timeslot.split(' ')[1];
    const days2 = t.split(' ')[0];
    const times2 = t.split(' ')[1];

    for (const day of ['M', 'TU', 'W', 'TH', 'F']) {
      if (days1.indexOf(day) >= 0 && days2.indexOf(day) >= 0) {
        if (isTimeOverlap(times1, times2)) {
          return false;
        }
      }
    }
  }

  return true;
}

function isTimeOverlap (t1, t2) {
  const t1start = timeStrToInt(t1.split('-')[0]);
  const t1end = timeStrToInt(t1.split('-')[1]);
  const t2start = timeStrToInt(t2.split('-')[0]);
  const t2end = timeStrToInt(t2.split('-')[1]);

  if (t1start <= t2start && t2start <= t1end) {
    return true;
  }
  if (t2start <= t1start && t1start <= t2end) {
    return true;
  }

  return false;
}

function scoreSort (a, b) {
  const aExtended = a.filter(v => v.extendedSemester).length > 0;
  const bExtended = b.filter(v => v.extendedSemester).length > 0;

  if (aExtended !== bExtended) {
    return aExtended ? 1 : -1;
  } else {
    const aScore = a.map(v => v.score).reduce((a, b) => a + b, 0);
    const bScore = b.map(v => v.score).reduce((a, b) => a + b, 0);
    return bScore - aScore;
  }
}

// function hasPrerequisiteConflict (coursePlan, newEntry) {

// }

// function isTimeOverlap (t1, t2) {
//   const t1start = await Controller.timeStrToInt(t1.split('-')[0]);
//   const t1end = await Controller.timeStrToInt(t1.split('-')[1]);
//   const t2start = await Controller.timeStrToInt(t2.split('-')[0]);
//   const t2end = await Controller.timeStrToInt(t2.split('-')[1]);

//   if (t1start <= t2start && t2start <= t1end) {
//     return true;
//   }
//   if (t2start <= t1start && t1start <= t2end) {
//     return true;
//   }

//   return false;
// }

// https://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays
function flatten (arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

// https://stackoverflow.com/questions/3579486/sort-a-javascript-array-by-frequency-and-then-filter-repeats
function sortByFrequency (array) {
  const frequency = {};

  array.forEach(function (value) { frequency[value] = 0; });

  const uniques = array.filter(function (value) {
    return ++frequency[value] === 1;
  });

  return uniques.sort(function (a, b) {
    return frequency[b] - frequency[a];
  });
}

function isTimeInRange (t1start, t1end, t2start, t2end) {
  return t1start <= t2start && t1end >= t2end;
}

function timeStrToInt (t1) {
  if (t1 === undefined) {
    return 0;
  }
  if (t1.length === 6) t1 = '0' + t1;
  return (parseInt(t1.slice(0, 2)) % 12) * 60 +
    parseInt(t1.slice(3, 5)) +
    (t1.slice(5, 7) === 'PM' ? 720 : 0);
}

module.exports = suggestCoursePlan;

// (async () => {
//   const result = await suggestCoursePlan();
//   console.log(result.map(a => a.map(b => b.department + b.course_num)));
// })();

/*
use only course offerings, consider time/prereq conflicts

use some sort of scoring and show multiple best plans
the suggested courses are added to the course plan, marked "suggested"; can be approved/rejected/approve all

smart suggest: guided by course popularity
*/
