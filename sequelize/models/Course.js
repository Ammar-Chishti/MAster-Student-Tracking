const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('Courses', {
    course_id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true
    },
    department: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[A-Z]{3}', 'i'], len: [3, 3] }
    },
    course_num: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[0-9]{3}', 'i'], len: [3, 3] }
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },
    // description: {
    //   type: DataTypes.TEXT,
    //   allowNull: false,
    //   defaultValue: ''
    // },
    credits: {
      type: DataTypes.INTEGER,
      validate: { min: -1 },
      allowNull: false,
      defaultValue: 3
    },
    creditRangeMin: {
      type: DataTypes.INTEGER,
      validate: { min: -1 },
      allowNull: false,
      defaultValue: 3
    },
    creditRangeMax: {
      type: DataTypes.INTEGER,
      validate: { min: -1 },
      allowNull: false,
      defaultValue: 3
    },
    repeatable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    prereqs: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['department', 'course_num', 'semester', 'year']
      }
    ]
  });
};
