const mysql = require('mysql2/promise');
const { DB } = require('./config');

const pool = mysql.createPool({
  host    : DB.host,
  port    : DB.port,
  user    : DB.user,
  password: DB.password,
  database: DB.name,

  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,

  charset    : 'utf8mb4_unicode_ci',
  dateStrings: true,
  timezone   : '+08:00',

  multipleStatements: false
});

module.exports = pool;