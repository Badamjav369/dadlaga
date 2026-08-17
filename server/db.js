// =====================================================
//  db.js — MySQL холболтын pool
//  Тохиргоо config.js-ээс ирнэ (шалгагдсан утгууд)
// =====================================================

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

  // Олон командыг нэг мөрөнд явуулахыг хориглоно.
  // SQL тарилга амжилттай болсон ч нэмэлт команд залгах боломжгүй.
  multipleStatements: false
});

module.exports = pool;