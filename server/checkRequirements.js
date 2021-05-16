const satisfiedGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'S', 'T'];

// check status of course plan given some set of requirements
function checkRequirements (degree, coursePlan, proficiency) {
  const coursePlanGPA = coursePlan.filter(c => !c.transfer);
  coursePlan = coursePlan.map(c => c.dataValues)
    .filter(c => ['', 'I', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'S', 'T'].indexOf(c.grade) >= 0);
  const result = {
    department: degree.department,
    track: degree.track,
    requirementsStatus: -1, // satisfied, pending, unsatisfied, graduated
    coursePlanStatus: -1, // invalid, complete, incomplete
    requirementCount: 0, // number of total requirements
    pending: 0, // number of requirements pending
    satisfied: 0, // number satisfied
    unsatisfied: 0, // number unsatisfied
    details: [], // string details
    details2: [] // details, object form
  };

  // list of courses already used to satisfy some requirement
  const usedCourses = [];

  // top level keys in requirements array:
  // credits, GPA, required, semesters, elective, project, thesis, lectures, breadth
  for (const req of degree.requirements) {
    result.requirementCount += 1;
    // console.log(req.desc);
    switch (Object.keys(req)[0]) {
      case 'credits': checkCreditRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'GPA': checkGPARequirement(req, degree, coursePlanGPA, usedCourses, result); break;
      case 'required': checkRequiredRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'semesters': checkSemestersRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'elective': checkElectiveRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'project': checkProjectRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'thesis': checkThesisRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'lectures': checkLecturesRequirement(req, degree, coursePlan, usedCourses, result); break;
      case 'breadth': checkBreadthRequirement(req, degree, coursePlan, usedCourses, result); break;
      default: result.requirementCount -= 1; break;
    }
  }

  checkProficiencyRequirements(degree, coursePlan, result, proficiency);

  // update status of degree and course plan
  updateStatus(result);
  return result;
}

// check if credit requirement is satisfied
// subkeys: overall, department, restrictions
function checkCreditRequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: '', satisfiedBy: '', type: 'credits' };

  // count credits
  let sumSatisfied = 0;
  let sumPending = 0;
  let sumDepartmentSatisfied = 0;
  let sumDepartmentPending = 0;

  // console.log(coursePlan);

  for (const course of coursePlan) {
    if (course.course_num >= 500 && satisfiedGrades.indexOf(course.grade) >= 0) {
      sumSatisfied += course.credits;
      if (course.department === degree.department) {
        sumDepartmentSatisfied += course.credits;
      }
    } else {
      sumPending += course.credits;
      if (course.department === degree.department) {
        sumDepartmentPending += course.credits;
      }
    }
  }

  // console.log(sumSatisfied, sumPending, sumDepartmentSatisfied, sumDepartmentPending);
  // console.log(req.credits.overall);
  // console.log(req.credits.department);

  // status: 0 unsatisfied, 1 pending, 2 satisfied
  let status = 0;
  let details = '';
  // check overall credits
  if (req.credits.overall !== undefined) {
    detailsObj.description += 'Overall Credits: ' + req.credits.overall + '; ';

    // TODO: check req.restrictions
    if (sumSatisfied >= req.credits.overall) {
      status = 2;
      details += 'overall credits satsified: ';
    } else if ((sumSatisfied + sumPending) >= req.credits.overall) {
      status = 1;
      details += 'overall credits pending: ';
    } else {
      status = 0;
      details += 'overall credits not satisfied: ';
    }
    details += sumSatisfied + '+' + sumPending + ' /' + req.credits.overall + '; ';
    detailsObj.satisfiedBy += sumSatisfied + '(' + sumPending + ') / ' + req.credits.overall + '; ';
  }

  // check department credits
  if (req.credits.department !== undefined) {
    detailsObj.description += 'Department Credits: ' + req.credits.department;

    if (sumDepartmentSatisfied >= req.credits.department) {
      status = 2;
      details += 'department credits satisfied: ';
    } else if ((sumDepartmentSatisfied + sumDepartmentPending) >= req.credits.department) {
      status = 1;
      details += 'department credits pending satisfied: ';
    } else {
      status = 0;
      details += 'department credits not satisfied: ';
    }
    details += sumDepartmentSatisfied + '+' + sumDepartmentPending + ' /' + req.credits.department;
    detailsObj.satisfiedBy += sumDepartmentSatisfied + '(' + sumDepartmentPending + ') / ' + req.credits.department;
  }

  if (status === 0) {
    result.unsatisfied += 1;
    detailsObj.status = 'Unsatisfied';
    detailsObj.satisfyList = [];
  } else if (status === 1) {
    result.pending += 1;
    detailsObj.status = 'Pending';
  } else {
    result.satisfied += 1;
    detailsObj.status = 'Satisfied';
  }
  result.details.push(details);

  result.details2.push(detailsObj);
}

// check if GPA requirement is satisfied
// subkeys: overall, department
function checkGPARequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: '', satisfiedBy: '', type: 'GPA' };

  const gradesToGPA = {
    A: 4.00,
    'A-': 3.67,
    'B+': 3.33,
    B: 3.00,
    'B-': 2.67,
    'C+': 2.33,
    C: 2.00,
    'C-': 1.67,
    'D+': 1.33,
    D: 1.00,
    F: 0.00,
    Q: 0.00
  };

  let status = 0;
  // check overall GPA
  if (req.GPA.overall !== undefined) {
    detailsObj.description += 'Overall GPA: ' + req.GPA.overall.toFixed(2) + '; ';

    // list filter/map/reduce operations to calculate GPA
    const countsToGPA = coursePlan.filter(c => gradesToGPA[c.grade] !== undefined);
    let GPA = countsToGPA.map(c => gradesToGPA[c.grade] * c.credits)
      .reduce((a, b) => a + b, 0) / countsToGPA.map(c => c.credits).reduce((a, b) => a + b, 0);
    GPA = GPA || 0; // handle NaN
    if (GPA < req.GPA.overall) {
      status = 1;
      result.details.push('overall GPA not satisfied: ' + GPA + '/' + req.GPA.overall + '; ');
    } else {
      result.details.push('overall GPA satisfied: ' + GPA + '/' + req.GPA.overall + '; ');
    }

    detailsObj.satisfiedBy += GPA.toFixed(2) + ' / ' + req.GPA.overall.toFixed(2) + '; ';
  }

  // same as above but for department GPA
  if (req.GPA.department !== undefined) {
    detailsObj.description += 'Department GPA: ' + req.GPA.department.toFixed(2);

    const countsToGPA = coursePlan.filter(c => gradesToGPA[c.grade] !== undefined && c.department === degree.department);
    let GPA = countsToGPA.map(c => gradesToGPA[c.grade] * c.credits)
      .reduce((a, b) => a + b, 0) / countsToGPA.map(c => c.credits).reduce((a, b) => a + b, 0);
    GPA = GPA || 0;
    if (GPA < req.GPA.department) {
      status = 1;
      result.details.push('department GPA not satisfied: ' + GPA + '/' + req.GPA.department);
    } else {
      result.details.push('department GPA satisfied: ' + GPA + '/' + req.GPA.department + '; ');
    }

    detailsObj.satisfiedBy += GPA.toFixed(2) + ' / ' + req.GPA.department.toFixed(2);
  }

  if (status === 0) {
    result.satisfied += 1;
    detailsObj.status = 'Satisfied';
  } else {
    result.pending += 1;
    detailsObj.status = 'Pending';
  }

  result.details2.push(detailsObj);
}

// check if required courses are satisfied
function checkRequiredRequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: '', satisfiedBy: '', type: 'required' };

  for (const r of req.required) {
    detailsObj.description = 'Required Course: ' + req.required.toString().replaceAll(',', ' or ');

    const satisfiedBy = coursePlan.filter(c => (r === c.department + ' ' + c.course_num) &&
      (usedCourses.indexOf(c.course_plan_id) < 0));
    if (satisfiedBy.length > 0) {
      const completed = satisfiedBy.filter(c => satisfiedGrades.indexOf(c.grade) >= 0);
      if (completed.length > 0) {
        result.satisfied += 1;
        result.details.push('required course satisfied: ' + completed[0].department + ' ' + completed[0].course_num);
        usedCourses.push(completed[0].course_plan_id);

        detailsObj.satisfiedBy = completed[0].department + ' ' + completed[0].course_num;
        detailsObj.SemesterYear = completed[0].semester + ' ' + completed[0].year;
        detailsObj.grade = completed[0].grade;
        detailsObj.status = 'Satisfied';
        result.details2.push(detailsObj);
        return;
      } else {
        result.pending += 1;
        result.details.push('required course pending satisfied: ' + satisfiedBy[0].department + ' ' + satisfiedBy[0].course_num);
        usedCourses.push(satisfiedBy[0].course_plan_id);

        detailsObj.satisfiedBy = satisfiedBy[0].department + ' ' + satisfiedBy[0].course_num;
        detailsObj.SemesterYear = satisfiedBy[0].semester + ' ' + satisfiedBy[0].year;
        detailsObj.grade = satisfiedBy[0].grade;
        detailsObj.status = 'Pending';
        result.details2.push(detailsObj);
        return;
      }
    }
  }
  result.unsatisfied += 1;
  result.details.push('required course not satisfied: ' + req.required);
  detailsObj.status = 'Unsatisfied';
  detailsObj.satisfyList = req.required;
  result.details2.push(detailsObj);
}

// check if semester requirements are satisfied
// subkeys: course, count
function checkSemestersRequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: '', satisfiedBy: '', type: 'semesters' };

  const satisfiedBy = coursePlan.filter(c => (req.semesters.course[0] === c.department + ' ' + c.course_num) &&
    (usedCourses.indexOf(c.course_plan_id) < 0));
  const completed = satisfiedBy.filter(c => satisfiedGrades.indexOf(c.grade) >= 0);

  if (req.semesters.count === -1) {
    const uniqueSemesters = coursePlan.map(c => c.semester + c.year).filter((v, i, a) => a.indexOf(v) === i);
    req.semesters.count = uniqueSemesters.length;
  }

  detailsObj.description = req.semesters.count + ' Semesters of ' + req.semesters.course[0];

  if (completed.length >= req.semesters.count) {
    result.satisfied += 1;
    result.details.push('semester course requirement satisfied: ' + req.semesters.course);

    detailsObj.status = 'Satisfied';
    detailsObj.satisfiedBy = req.semesters.course[0];
  } else if (satisfiedBy.length >= req.semesters.count) {
    result.pending += 1;
    result.details.push('semester course requirement pending satisfied: ' + req.semesters.course);

    detailsObj.status = 'Pending';
    detailsObj.satisfiedBy = req.semesters.course[0];
  } else {
    result.unsatisfied += 1;
    result.details.push('semester course requirement not satisfied: ' + req.semesters.course);
    detailsObj.satisfyList = req.semesters.course;
    detailsObj.status = 'Unsatisfied';
  }

  detailsObj.SemesterYear = completed.map(v => v.semester + ' ' + v.year).toString().replaceAll(',', ', ');
  detailsObj.grade = completed.map(v => v.grade).toString().replaceAll(',', ', ');
  result.details2.push(detailsObj);
}

// check if elecitve courses are satisfied
function checkElectiveRequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: '', satisfiedBy: '', type: 'elective' };
  detailsObj.description = '1 Elective in ' + req.elective
    .filter((v, i) => i < 5).toString().replaceAll(',', ', ') + (req.elective.length > 5 ? ', etc.' : '');

  for (const r of req.elective) {
    const satisfiedBy = coursePlan.filter(c => (r === c.department + ' ' + c.course_num) &&
      (usedCourses.indexOf(c.course_plan_id) < 0));
    if (satisfiedBy.length > 0) {
      const completed = satisfiedBy.filter(c => ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'T'].indexOf(c.grade) >= 0);
      // console.log(completed);
      if (completed.length > 0) {
        result.satisfied += 1;
        result.details.push('elective course satisfied: ' + completed[0].department + ' ' + completed[0].course_num);
        usedCourses.push(completed[0].course_plan_id);
        detailsObj.satisfiedBy = completed[0].department + ' ' + completed[0].course_num;
        detailsObj.SemesterYear = completed[0].semester + ' ' + completed[0].year;
        detailsObj.grade = completed[0].grade;
        detailsObj.status = 'Satisfied';
        result.details2.push(detailsObj);
        return;
      } else {
        result.pending += 1;
        result.details.push('elective course pending satisfied: ' + satisfiedBy[0].department + ' ' + satisfiedBy[0].course_num);
        usedCourses.push(satisfiedBy[0].course_plan_id);
        detailsObj.satisfiedBy = satisfiedBy[0].department + ' ' + satisfiedBy[0].course_num;
        detailsObj.SemesterYear = satisfiedBy[0].semester + ' ' + satisfiedBy[0].year;
        detailsObj.grade = satisfiedBy[0].grade;
        detailsObj.status = 'Pending';
        result.details2.push(detailsObj);
        return;
      }
    }
  }
  result.unsatisfied += 1;
  result.details.push('elective course not satisfied, choose one of: ' + req.elective);
  detailsObj.status = 'Unsatisfied';
  detailsObj.satisfyList = req.elective;
  result.details2.push(detailsObj);
}

// check if project requirements are satisfied
// subkeys: list, credits
function checkProjectRequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: '', satisfiedBy: '', type: 'project' };

  if (degree.department === 'CSE') {
    detailsObj.description = 'Project Requirement: ' + req.project.toString().replace(',', ', ');

    const completed = coursePlan.filter(c => satisfiedGrades.indexOf(c.grade) >= 0);
    const listCoursesCompleted = completed.map(c => c.department + ' ' + c.course_num);
    const listCourses = coursePlan.map(c => c.department + ' ' + c.course_num);

    const intersection1 = req.project.filter(value => listCourses.includes(value));
    const intersection2 = req.project.filter(value => listCoursesCompleted.includes(value));

    if (intersection2.length === req.project.length) {
      result.satisfied += 1;
      result.details.push('project requirement satisfied: ' + req.project);

      detailsObj.satisfiedBy = req.project.toString().replace(',', ', ');
      detailsObj.status = 'Satisfied';
    } else if (intersection1.length === req.project.length) {
      result.pending += 1;
      result.details.push('project requirement pending satisfied: ' + req.project);

      detailsObj.satisfiedBy = req.project.toString().replace(',', ', ');
      detailsObj.status = 'Pending';
    } else {
      result.unsatisfied += 1;
      result.details.push('project requirement satisfied: ' + req.project);
      detailsObj.satisfyList = req.project;

      detailsObj.status = 'Unsatisfied';
    }

    if (detailsObj.status !== 'Unsatisfied') {
      detailsObj.SemesterYear = coursePlan
        .filter(c => req.project.indexOf(c.department + ' ' + c.course_num) >= 0)
        .map(c => c.semester + ' ' + c.year)
        .toString().replaceAll(',', ', ');
      detailsObj.grade = coursePlan
        .filter(c => req.project.indexOf(c.department + ' ' + c.course_num) >= 0)
        .map(c => c.grade)
        .toString().replaceAll(',', ', ');
    }

    result.details2.push(detailsObj);
    return;
  }

  detailsObj.description = 'Project Requirement: ' + req.project.list;

  const satisfiedBy = coursePlan.filter(c => (req.project.list[0] === c.department + ' ' + c.course_num) &&
    (usedCourses.indexOf(c.course_plan_id) < 0));
  const completed = satisfiedBy.filter(c => satisfiedGrades.indexOf(c.grade) >= 0);

  const satisfiedCredits = satisfiedBy.map(c => c.credits).reduce((a, b) => a + b, 0);
  const completedCredits = completed.map(c => c.credits).reduce((a, b) => a + b, 0);

  if (completedCredits >= req.project.credits) {
    result.satisfied += 1;
    result.details.push('project requirement satisfied: ' + req.project.list);

    detailsObj.satisfiedBy = req.project.list.toString();
    detailsObj.status = 'Satisfied';
  } else if (satisfiedCredits >= req.project.credits) {
    result.pending += 1;
    result.details.push('project requirement pending satisfied: ' + req.project.list);

    detailsObj.satisfiedBy = req.project.list.toString();
    detailsObj.status = 'Pending';
  } else {
    result.unsatisfied += 1;
    result.details.push('project requirement not satisfied: ' + req.project.list);
    detailsObj.satisfyList = req.project.list;
    detailsObj.status = 'Unsatisfied';
  }

  if (detailsObj.status !== 'Unsatisfied') {
    detailsObj.SemesterYear = coursePlan
      .filter(c => req.project.list.indexOf(c.department + ' ' + c.course_num) >= 0)
      .map(c => c.semester + ' ' + c.year)
      .toString().replaceAll(',', ', ');
    detailsObj.grade = coursePlan
      .filter(c => req.project.list.indexOf(c.department + ' ' + c.course_num) >= 0)
      .map(c => c.grade)
      .toString().replaceAll(',', ', ');
  }

  result.details2.push(detailsObj);
}

// check if thesis requirements are satisfied
// subkeys: list, credits
function checkThesisRequirement (req, degree, coursePlan, usedCourses, result) {
  const detailsObj = { description: 'Thesis Requirement: ' + req.thesis.list, satisfiedBy: '', type: 'thesis' };

  const satisfiedBy = coursePlan.filter(c => (req.thesis.list[0] === c.department + ' ' + c.course_num) &&
    (usedCourses.indexOf(c.course_plan_id) < 0));
  const completed = satisfiedBy.filter(c => satisfiedGrades.indexOf(c.grade) >= 0);

  const satisfiedCredits = satisfiedBy.map(c => c.credits).reduce((a, b) => a + b, 0);
  const completedCredits = completed.map(c => c.credits).reduce((a, b) => a + b, 0);

  if (completedCredits >= req.thesis.credits) {
    result.satisfied += 1;
    result.details.push('project requirement satisfied: ' + req.thesis.list);
    detailsObj.status = 'Satisfied';
  } else if (satisfiedCredits >= req.thesis.credits) {
    result.pending += 1;
    result.details.push('project requirement pending satisfied: ' + req.thesis.list);
    detailsObj.status = 'Pending';
  } else {
    result.unsatisfied += 1;
    result.details.push('project requirement not satisfied: ' + req.thesis.list);
    detailsObj.satisfyList = req.thesis.list;
    detailsObj.status = 'Unsatisfied';
  }

  if (detailsObj.status !== 'Unsatisfied') {
    detailsObj.satisfiedBy = req.thesis.list[0];
    detailsObj.SemesterYear = coursePlan
      .filter(c => req.thesis.list.indexOf(c.department + ' ' + c.course_num) >= 0)
      .map(c => c.semester + ' ' + c.year)
      .toString().replaceAll(',', ', ');
    detailsObj.grade = coursePlan
      .filter(c => req.thesis.list.indexOf(c.department + ' ' + c.course_num) >= 0)
      .map(c => c.grade)
      .toString().replaceAll(',', ', ');
  }

  result.details2.push(detailsObj);
}

// check if lecture requirements are satisfied
// subkeys: list, count
function checkLecturesRequirement (req, degree, coursePlan, usedCourses, result) {
  result.requirementCount += (req.lectures.count - 1);

  const lectures = coursePlan.filter(c => req.lectures.list.indexOf(
    c.department + ' ' + c.course_num) >= 0);
  const lecturesComplete = lectures.filter(c => satisfiedGrades.indexOf(c.grade) >= 0);
  const lecturesPending = lectures.filter(c => c.grade === '' || c.grade === 'I');

  let count = 0;
  for (const c of lecturesComplete) {
    if (count >= req.lectures.count) {
      return;
    }
    count += 1;
    const detailsObj = { description: '1 CSE Graduate Lecture Class', type: 'lectures' };
    detailsObj.satisfiedBy = c.department + ' ' + c.course_num;
    detailsObj.grade = c.grade;
    detailsObj.SemesterYear = c.semester + ' ' + c.year;
    detailsObj.status = 'Satisfied';
    result.satisfied += 1;
    result.details.push('satifisfied by: ' + detailsObj.satisfiedBy);
    result.details2.push(detailsObj);
  }

  for (const c of lecturesPending) {
    if (count > req.lectures.count) {
      return;
    }
    count += 1;
    const detailsObj = { description: '1 CSE Graduate Lecture Class', type: 'lectures' };
    detailsObj.satisfiedBy = c.department + ' ' + c.course_num;
    detailsObj.grade = c.grade;
    detailsObj.SemesterYear = c.semester + ' ' + c.year;
    detailsObj.status = 'Pending';
    result.pending += 1;
    result.details.push('pending satifisfied by: ' + detailsObj.satisfiedBy);
    result.details2.push(detailsObj);
  }

  while (true) {
    if (count > req.lectures.count) {
      return;
    }
    count += 1;
    const detailsObj = { description: '1 CSE Graduate Lecture Class', type: 'lectures' };
    detailsObj.status = 'Unsatisfied';
    result.unsatisfied += 1;
    result.details.push('pending satifisfied by: ' + detailsObj.satisfiedBy);
    detailsObj.satisfyList = req.lectures.list;
    result.details2.push(detailsObj);
  }
}

// check if breadth requirements are satisfied
function checkBreadthRequirement (req, degree, coursePlan, usedCourses, result) {
  result.requirementCount -= 1;

  // const listCoursesCompleted = coursePlan
  //   .filter(c => satisfiedGrades.indexOf(c.grade) >= 0)
  //   .map(c => c.department + ' ' + c.course_num); // 'A', 'A-', etc.
  // const listCourses = coursePlan
  //   .map(c => c.department + ' ' + c.course_num); // '', 'A', etc.

  const breadthNames = ['Theory', 'Systems', 'Information and Intelligent Systems'];
  for (const breadth of req.breadth) {
    result.requirementCount += 1;

    const detailsObj = { description: breadthNames.shift() + ' Breadth: ' + breadth.toString().replaceAll(',', ', '), type: 'breadth' };

    const checkComplete = coursePlan
      .filter(c => breadth.indexOf(c.department + ' ' + c.course_num) >= 0)
      .filter(c => satisfiedGrades.indexOf(c.grade) >= 0);

    const checkPending = coursePlan
      .filter(c => breadth.indexOf(c.department + ' ' + c.course_num) >= 0)
      .filter(c => c.grade === '' || c.grade === 'I');

    if (checkComplete.length > 0) {
      detailsObj.status = 'Satisfied';
      detailsObj.satisfiedBy = checkComplete[0].department + ' ' + checkComplete[0].course_num;
      detailsObj.SemesterYear = checkComplete[0].semester + ' ' + checkComplete[0].year;
      detailsObj.grade = checkComplete[0].grade;

      if (detailsObj.SemesterYear === 'Winter 1901') {
        detailsObj.SemesterYear = 'Transfer Credit';
      }
    } else if (checkPending.length > 0) {
      detailsObj.status = 'Pending';
      detailsObj.satisfiedBy = checkPending[0].department + ' ' + checkPending[0].course_num;
      detailsObj.SemesterYear = checkPending[0].semester + ' ' + checkPending[0].year;

      if (detailsObj.SemesterYear === 'Winter 1901') {
        detailsObj.SemesterYear = 'Transfer Credit';
      }

      detailsObj.grade = checkPending[0].grade;
    } else {
      detailsObj.satisfyList = breadth;
      detailsObj.status = 'Unsatisfied';
    }

    result.details2.push(detailsObj);
  }
}

function checkProficiencyRequirements (degree, coursePlan, result, proficiency) {
  // keep only unique elements
  proficiency = JSON.parse(proficiency);
  proficiency = proficiency.filter((v, i, a) => a.indexOf(v) === i);

  // console.log(proficiency);
  for (const p of proficiency) {
    result.requirementCount += 1;
    const detailsObj = { description: 'Proficiency Course: ' + p, type: 'proficiency' };

    const checkComplete = coursePlan
      .filter(c => c.department + ' ' + c.course_num === p)
      .filter(c => satisfiedGrades.indexOf(c.grade) >= 0);

    const checkPending = coursePlan
      .filter(c => c.department + ' ' + c.course_num === p)
      .filter(c => c.grade === '' || c.grade === 'I');

    // console.log(checkComplete);
    // console.log(checkPending);

    if (checkComplete.length > 0) {
      detailsObj.status = 'Satisfied';
      detailsObj.satisfiedBy = checkComplete[0].department + ' ' + checkComplete[0].course_num;
      detailsObj.SemesterYear = checkComplete[0].semester + ' ' + checkComplete[0].year;
      detailsObj.grade = checkComplete[0].grade;
    } else if (checkPending.length > 0) {
      detailsObj.status = 'Pending';
      detailsObj.satisfiedBy = checkPending[0].department + ' ' + checkPending[0].course_num;
      detailsObj.SemesterYear = checkPending[0].semester + ' ' + checkPending[0].year;

      detailsObj.grade = checkPending[0].grade;
    } else {
      detailsObj.status = 'Unsatisfied';
    }

    result.details2.push(detailsObj);
  }
}

// update statuses based on count of satisfied/pending/unsatisfied
function updateStatus (result) {
  if (result.unsatisfied > 0) {
    result.requirementsStatus = 'Unsatisfied';
    result.coursePlanStatus = 'Incomplete';
  } else if (result.pending > 0) {
    result.requirementsStatus = 'Pending';
    result.coursePlanStatus = 'Complete';
  } else {
    result.requirementsStatus = 'Satisfied';
    result.coursePlanStatus = 'Complete';
  }

  result.details2 = result.details2.map((v, i) => ({ ...v, id: i + 1 }));
  for (const d of result.details2) {
    if (d.SemesterYear === 'Winter 1901') {
      d.SemesterYear = 'Transfer Credit';
    }
  }
}

module.exports = checkRequirements;
