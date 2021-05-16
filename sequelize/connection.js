const { Sequelize } = require('sequelize');
const config = (process.env.NODE_ENV === 'production') ? require('./config.js') : require('./config2.js');

// create connection
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: config.dialect,
  logQueryParameters: true,
  // logging: false,
  define: {
    timestamps: true
  },

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// // test connection
// try {
//   sequelize.authenticate();
//   console.log('Connection has been established successfully.');
// } catch (error) {
//   console.error('Unable to connect to the database:', error);
// }

// export connection
module.exports = sequelize;
