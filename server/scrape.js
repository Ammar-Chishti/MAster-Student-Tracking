function scrape (fileContents, departments) {
  // remove \r carriage returns
  fileContents = fileContents.replace(/[\r]+/g, '');

  // split into array of course entries, using positive lookahead
  const arrayCourses = fileContents.split(/\n(?=[A-Z]{3} [0-9]{3}?:)/);
  arrayCourses.shift(); // ignore first entry
  const finalOutput = [];

  for (const entry of arrayCourses) {
    const obj = {}; // new object representing course

    // extract department, course_num, and description
    obj.department = entry.slice(0, 3);
    // only keep specified departments
    if (departments.length > 0 && departments.indexOf(obj.department) < 0) {
      continue;
    }
    obj.course_num = entry.slice(4, 7);
    const description = entry.slice(9);

    // check if course is repeatable
    obj.repeatable = description.search('May be repeated') >= 0;

    // extract title
    obj.title = description.slice(0, description.indexOf('\n\n'));

    // extract credits
    const creditText = description.match(/\b[0-9,-]+\b(?= credit)/i); // /i to be case insensitive
    if (creditText !== null) {
      obj.creditRangeMin = creditText[0].split('-')[0];
      obj.creditRangeMax = creditText[0].split('-')[1] || obj.creditRangeMin;
      // set credits to 3 if it lies within the range, otherwise to the minimum
      obj.credits = (obj.creditRangeMin <= 3 && obj.creditRangeMax >= 3) ? 3 : obj.creditRangeMin;
    } else {
      obj.credits = obj.creditRangeMin = obj.creditRangeMax = 3; // default to 3
    }

    // console.log(obj); // -------------------------------------------

    // extract prereqs
    const requisites = description.match(/(?<=requisite.*:).*/si); // /s to include matching new lines
    if (requisites !== null) {
      const matches = [...requisites[0].matchAll(/([A-Z]{3} ?[5-9][0-9]{2})|\/|and|or/gi)]; // /g for global

      // console.log(matches.map(m => m[0])); // ----------------------

      obj.prereqs = convertToPrereqList(matches.map(m => m[0])
        .filter(m => m !== obj.department + ' ' + obj.course_num));
    } else {
      obj.prereqs = [];
    }

    finalOutput.push(obj);
  }
  return finalOutput;
}

// convert an array such as
// [ 'ESE505', 'and', 'ESE 546', 'or', 'ESE 548', 'or', 'or']
// into a nested list
// [['ESE 505'], ['ESE 546', 'ESE 548']]
function convertToPrereqList (array) {
  // convert forward slashes and non-spaced separated courses
  array = array.map(function (value) {
    if (value === '/') {
      return 'or';
    } else if (/[A-Z]{3}[0-9]{3}/.test(value)) {
      return value.slice(0, 3) + ' ' + value.slice(3, 6);
    } else {
      return value;
    }
  });

  // console.log(array); // -------------------------------------------

  // remove any trailing 'and' and 'or'
  const startIndex = array.findIndex(value => /[A-Z]{3} [0-9]{3}/.test(value));
  if (startIndex === -1) {
    return [];
  } else {
    array = array.slice(startIndex);
  }
  while (!/[A-Z]{3} [0-9]{3}/.test(array[array.length - 1])) {
    array.pop();
  }

  // console.log(array); // -------------------------------------------

  const countOr = array.filter(v => v === 'or').length;
  const countAnd = array.filter(v => v === 'and').length;

  // case 1: no occurences of 'or', zero or one 'and'
  if (countOr === 0 && countAnd <= 1) {
    return array.filter(v => v !== 'and').map(v => [v]);
  }

  // case 2: single occurence of 'or'
  if (countOr === 1 && countAnd === 0) {
    return [array.filter(v => v !== 'or')];
  }

  // console.log(array); // -------------------------------------------

  // case 3: handle multiple 'and' and 'or' occurences
  let nestedList = [];
  nestedList.push([]);
  let index = 0;
  for (const value of array) {
    if (value === 'and') {
      nestedList.push([]);
      index += 1;
    } else if (value !== 'or') {
      nestedList[index].push(value);
    }
  }
  nestedList = nestedList.filter(v => v.length > 0);

  // console.log(nestedList); // --------------------------------------
  return nestedList;
}

// test this file without module import
// const fs = require('fs');
// const fileContents = fs.readFileSync('./import-files/gradcourses-spring2021-edited.txt').toString();
// const results = scrape(fileContents, ['AMS', 'BMI', 'CSE', 'ESE']);

// for (const c of results) {
//   console.log(c);
// }

module.exports = scrape;
