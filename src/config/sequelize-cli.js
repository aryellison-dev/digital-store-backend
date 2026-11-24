const env = require('./env');
const config = {
  username: env.db.username,
  password: env.db.password,
  database: env.db.database,
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: false,
};
module.exports = { development: config, test: config, production: config };
