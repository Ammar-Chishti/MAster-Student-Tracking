const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('Students', {
    sbu_id: {
      primaryKey: true,
      type: DataTypes.CHAR(10),
      allowNull: false
    },
    // degree_requirement_id: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false
    // },
    // instead of using an association, have department+track columns for Student
    // this allows adding a student even if the associated degree does not exist yet
    department: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[A-Z]{3}', 'i'] }
    },
    track: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidTrack (value) {
          value = value.toLowerCase();
          if ( // validate track by department, maybe use a fuzzy search?
            (this.department === 'AMS' && [
              'computational applied mathematics', 'computational biology', 'operations research',
              'quantitative finance', 'statistics'].indexOf(value) < 0) ||
            (this.department === 'BMI' && [
              'imaging informatics with thesis', 'imaging informatics with project', 'clinical informatics with thesis',
              'clinical informatics with project', 'translational bioinformatics with thesis',
              'translational bioinformatics with project'].indexOf(value) < 0) ||
            (this.department === 'CSE' && [
              'special project', 'advanced project', 'thesis'].indexOf(value) < 0) ||
            (this.department === 'ESE' && [
              'non-thesis', 'thesis'].indexOf(value) < 0)) {
            throw new Error('Invalid track for department ' + this.department);
          }
        }
      }
    },
    entry_semester: {
      type: DataTypes.CHAR(10),
      allowNull: false,
      validate: { isIn: [['Winter', 'Spring', 'SummerI', 'SummerII', 'Fall']] }
    },
    entry_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1901, max: 2155 }
    },
    requirement_version_semester: {
      type: DataTypes.CHAR(10),
      allowNull: false,
      validate: { isIn: [['Winter', 'Spring', 'SummerI', 'SummerII', 'Fall']] }
    },
    requirement_version_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1901, max: 2155 }
    },
    graduation_semester: {
      type: DataTypes.CHAR(10),
      allowNull: false,
      validate: { isIn: [['Winter', 'Spring', 'SummerI', 'SummerII', 'Fall']] }
    },
    graduation_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1901, max: 2155 }
    },
    graduated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
    advisor: {
      type: DataTypes.CHAR(50),
      allowNull: true,
      defaultValue: ''
    },
    proficiency: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]'
    }
  });
};
