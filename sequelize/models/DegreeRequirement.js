const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('DegreeRequirements', {
    degree_requirement_id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true
    },
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
    semester: { // requirement_version_semester
      type: DataTypes.CHAR(10),
      allowNull: false,
      validate: { isIn: [['Winter', 'Spring', 'SummerI', 'SummerII', 'Fall']] }
    },
    year: { // requirement_version_year
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1901, max: 2155 }
    },
    requirements: { // json string representing requirements
      type: DataTypes.TEXT
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['department', 'track', 'semester', 'year']
      }
    ]
  });
};
