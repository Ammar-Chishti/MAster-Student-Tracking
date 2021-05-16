const sequelize = require('./connection.js');

// add all models
const Course = require('./models/Course.js')(sequelize);
const CourseOffering = require('./models/CourseOffering.js')(sequelize);
const CoursePlan = require('./models/CoursePlan.js')(sequelize);
const DegreeRequirement = require('./models/DegreeRequirement.js')(sequelize);
const Student = require('./models/Student.js')(sequelize);
const User = require('./models/User.js')(sequelize);

// add all associations
User.hasOne(Student, { foreignKey: 'sbu_id', onDelete: 'CASCADE', hooks: true });
Student.belongsTo(User, { foreignKey: 'sbu_id' });

Course.hasMany(CourseOffering, { foreignKey: 'course_id', onDelete: 'CASCADE', hooks: true });
CourseOffering.belongsTo(Course, { foreignKey: 'course_id' });

Student.hasMany(CoursePlan, { foreignKey: 'sbu_id', onDelete: 'CASCADE', hooks: true });
CoursePlan.belongsTo(Student, { foreignKey: 'sbu_id' });

// CourseOffering.hasMany(CoursePlan, { foreignKey: 'course_offering_id', onDelete: 'CASCADE', hooks: true });
CourseOffering.hasMany(CoursePlan, { foreignKey: 'course_offering_id' });
CoursePlan.belongsTo(CourseOffering, { foreignKey: 'course_offering_id' });

// no longer used, student not explicitly associated with degree
// DegreeRequirement.hasMany(Student, { foreignKey: 'degree_requirement_id' });
// Student.belongsTo(DegreeRequirement, { foreignKey: 'degree_requirement_id' });

// export all models
module.exports = {
  Course,
  CourseOffering,
  CoursePlan,
  DegreeRequirement,
  Student,
  User
};
