const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];

const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

fs.readdirSync(__dirname)
  .filter(file => file !== basename && file.endsWith('.js'))
  .forEach(file => {
    const modelClass = require(path.join(__dirname, file));

    // ✅ Skip if model doesn't use class-based style
    if (typeof modelClass.init !== 'function') {
      console.warn(`Skipping model: ${file} (no .init function)`);
      return;
    }

    const model = modelClass.init(sequelize);
    db[model.name] = model;
  });


db.sequelize = sequelize;


module.exports = db;
