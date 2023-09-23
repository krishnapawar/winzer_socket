const express = require("express");
const { Server } = require("socket.io");
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origins: ['http://localhost:8080','http://localhost:8081','*']
  }
});
const cors = require("cors");
const port = 3000;
var mysql = require("mysql");
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", async (socket) => {
  // console.log("user connect");
  // try {
  //   var runningTableList = await runningTableData();
  //   var waitingTableList = await waitingTableData();
  //   var mytablelist = await mytableData();
  //   console.log(runningTableList);
  //   console.log(waitingTableList);
  //   console.log(mytablelist);
  //   socket.emit('response', { runningTableList, waitingTableList, mytablelist });
  // } catch (error) {
  //   console.error("Error on connection:", error);
  // }

  socket.on("username", async (msg) => {
    try {
      // console.log("username",msg);
      var runningTableList = await runningTableData();
      var waitingTableList = await waitingTableData(msg);
      var mytablelist = await mytableData(msg);
      socket.emit("user_change",true);
      socket.emit('response', { runningTableList, waitingTableList, mytablelist });
    } catch (error) {
      console.error("Error socket:", error);
    }
  });

  socket.on("user_change_table", async (msg) => {
    let msgs =msg;
    // console.log("msgs",msgs);
    socket.emit("user_change",true);
  })

  socket.on("disconnect", () => {
    // console.log("user disconnect");
    
  });
});

// const mysql = require("mysql2");

// Create a connection pool
const pool = mysql.createPool({
  host: '68.178.147.171',
  user: 'ludo',
  password: 'NdMW.n~,iIQQ',
  database: 'ludo',
  waitForConnections: true,
  connectionLimit: 10, // Adjust this limit based on your needs
  queueLimit: 0,      // 0 means unlimited queue
});

function queryDatabase(sql) {
  return new Promise((resolve, reject) => {
    // Use the pool to get a connection
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting database connection:', err);
        return reject(err.message);
        return;
      }

      // Now you can use the connection for database operations
      connection.query(sql, (queryErr, results) => {
        connection.release(); // Release the connection back to the pool when done

        if (queryErr) {
          return reject(queryErr.message);
        } else {
          resolve(results);
        }
      });
    });
  });
}

async function runningTableData() {
  let sql = `
    SELECT lut.id, users.name, users.username, op.name as opponent_name, op.username as opponent_username, lut.ludo_table_code as room_code, lut.amount, lut.joining_amount, lut.winning_amount, lut.tbl_status as table_status, lut.game_type, lut.created_at, lut.user_status, lut.joiner_status as opponent_status
    FROM ludo_user_tables lut
    INNER JOIN users ON users.username = lut.username
    INNER JOIN users op ON op.username = lut.joining_user
    WHERE lut.tbl_status='running' AND lut.game_type IS NULL
    ORDER BY lut.id DESC`;

  try {
    const result = await queryDatabase(sql);
    return result.length > 0 ? result : [];
    // "Sorry! There is no Tournament in running status at this time.";
  } catch (error) {
    throw error;
  }
}

async function mytableData(user = "") {
  let sql = `
    SELECT lut.id,users.name,users.username,op.name as opponent_name,op.username as opponent_username,lut.ludo_table_code as room_code,lut.amount,lut.joining_amount,lut.winning_amount,lut.tbl_status as table_status,lut.game_type,lut.created_at,lut.user_status,lut.joiner_status as opponent_status,
    IF(users.username='${user}', lut.user_status, lut.joiner_status) as Userstatus 
    FROM ludo_user_tables lut
    LEFT JOIN users ON users.username = lut.username
    LEFT JOIN users op ON op.username = lut.joining_user
    WHERE (lut.tbl_status='waiting' OR lut.tbl_status='running' OR lut.tbl_status='conflict')`;

  if (user) {
    sql += ` AND (lut.username = '${user}' OR lut.joining_user = '${user}')`;
  }

  sql += ` ORDER BY lut.id DESC`;

  try {
    const result = await queryDatabase(sql);
    return result.length > 0 ? result :[];
    //  "Sorry! There is no Tournament in waiting status at this time.";
  } catch (error) {
    throw error;
  }
}


async function waitingTableData(user = "") {
  let sql = `
    SELECT lut.id, users.name, users.username, lut.ludo_table_code as room_code, lut.amount, lut.joining_amount, lut.winning_amount, lut.tbl_status as table_status, lut.game_type, lut.created_at, lut.user_status, lut.joiner_status as opponent_status
    FROM ludo_user_tables lut
    LEFT JOIN users ON users.username = lut.username
    WHERE lut.tbl_status='waiting' AND lut.user_status!='cancel' AND lut.joiner_status!='cancel' AND lut.game_type IS NULL`;
    if (user) {
      sql += ` AND lut.username!='${user}'`;
    }
  
    sql += ` ORDER BY lut.id DESC`;

  try {
    const result = await queryDatabase(sql, [user]);
    return result.length > 0 ? result :[];
    //  "Sorry! There is no Tournament in waiting status at this time.";
  } catch (error) {
    throw error;
  }
}

http.listen(3000, () => {
  console.log('listening on *:3000');
});
