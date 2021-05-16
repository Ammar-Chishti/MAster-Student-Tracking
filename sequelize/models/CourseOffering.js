const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('CourseOfferings', {
    course_offering_id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: true // allow course offerings to exist for courses that have not been imported
    },
    oldDescription: { // indicate if this course offering is associated with an old description
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    // duplicate columns from associated course
    department: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[A-Z]{3}', 'i'] }
    },
    course_num: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[0-9]{3}', 'i'] }
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
    credits: {
      type: DataTypes.INTEGER,
      validate: { min: -1 },
      allowNull: false,
      defaultValue: 3
    },
    prereqs: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    repeatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // end of duplicate columns from course

    section: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 99 }
    },
    timeslot: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
      validate: {
        is: [/(^$)|([M|TU|W|TH|F]+(\s*)(\d?\d:\d\d(AM|PM)-\d?\d:\d\d(AM|PM)))/, 'i']
      }
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['department', 'course_num', 'semester', 'year', 'section']
      }
    ]
  });
};
