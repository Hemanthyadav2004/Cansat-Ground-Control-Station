const { Sequelize } = require('sequelize');

// Replace with your PostgreSQL credentials
const sequelize = new Sequelize('cansatdb', 'postgres', 'Hemanth@1', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false, // optional: disable SQL logging
});

module.exports = sequelize;
