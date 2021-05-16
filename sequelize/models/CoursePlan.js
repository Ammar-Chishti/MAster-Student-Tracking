const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('CoursePlan', {
    course_plan_id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true
    },
    sbu_id: {
      type: DataTypes.CHAR(10),
      allowNull: false
    },
    course_offering_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    validity: { // 0: invalid, 1: valid, 2: temporarily valid
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2
    },
    transfer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    timeConflict: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    pendingApproval: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    // duplicate columns from associated course offering
    department: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[A-Z]{3}|N/A', 'i'] }
    },
    course_num: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[0-9]{3}|N/A', 'i'] }
    },
    cse587_course_num: {
      type: DataTypes.CHAR(3),
      allowNull: true,
      defaultValue: 'N/A',
      validate: { is: ['[0-9]{3}|N/A', 'i'] }
    },
    semester: {
      type: DataTypes.CHAR(10),
      allowNull: false,
      validate: { isIn: [['Winter', 'Spring', 'SummerI', 'SummerII', 'Fall']] }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1901, max: 2155 }
    },
    section: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
      validate: { min: 0 }
    },
    timeslot: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        is: [/(^$)|([M|TU|W|TH|F]+(\s*)(\d?\d:\d\d(AM|PM)-\d?\d:\d\d(AM|PM)))/, 'i']
      }
    },
    credits: {
      type: DataTypes.INTEGER,
      validate: { min: -1 },
      allowNull: false,
      defaultValue: 3
    },
    prereqs: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]'
    },
    // end of duplicate columns from course offering

    grade: {
      type: DataTypes.CHAR(2),
      allowNull: false,
      defaultValue: '',
      validate: {
        isIn: [[
          '', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D',
          'F', 'I', 'NC', 'NR', 'P', 'Q', 'R', 'S', 'U', 'W', 'T'
        ]]
      }
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['sbu_id', 'department', 'course_num', 'section', 'semester', 'year']
      }
    ]
  });
};
