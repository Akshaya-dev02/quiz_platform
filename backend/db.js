// db.js - MySQL connection pool using MySQL2 + dotenv

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

console.log(">>> LOADING DB CONFIG...");

// Read from .env (DO NOT HARD-CODE)
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || 'akshaya@02',
  database: process.env.MYSQL_DB || 'ai_quiz',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

console.log(">>> DB.JS INITIALIZED");

// Test connection immediately
pool.getConnection()
  .then(conn => {
    console.log(">>> MYSQL CONNECTED SUCCESSFULLY");
    conn.release();
  })
  .catch(err => {
    console.error(">>> MYSQL CONNECTION FAILED:");
    console.error(err);
  });
