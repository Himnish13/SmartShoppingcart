const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",        // better than localhost (avoids IPv6 issues)
  port: 3307,               // ✅ explicit MySQL port
  user: "root",
  password: "root",
  database: "main_server"   // 🔥 FIX: match your actual DB name (lowercase)
});

db.connect(err => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL");
  }
});

module.exports = db;