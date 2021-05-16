const { DataTypes } = require('sequelize');

module.exports = function (sequelize) {
  return sequelize.define('Users', {
    sbu_id: {
      primaryKey: true,
      type: DataTypes.CHAR(10),
      allowNull: false,
      validate: { isNumeric: true, len: [1, 10] }
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // email validation is pretty strict compared to front-end
      // validate: { notEmpty: true, isEmail: true },
      vaildate: { notEmpty: true },
      unique: true
    },
    // password: {
    //   type: DataTypes.STRING,
    //   allowNull: false,
    //   validate: { len: [8, 200] }
    // },
    hashedPassword: DataTypes.STRING, // hash + salt stored together
    isGPD: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // GPD should only see students in the same department
    department: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      validate: { is: ['[A-Z]{3}', 'i'] }
    }
  });
};
