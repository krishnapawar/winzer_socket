var mysql = require("mysql");
// Create a connection pool
const pool = mysql.createPool({
    host: '',
    user: '',
    password: '',
    database: '',
    waitForConnections: true,
    connectionLimit: 10, // Adjust this limit based on your needs
    queueLimit: 0,      // 0 means unlimited queue
  });

  module.exports = pool;