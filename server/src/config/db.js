const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "11111111",
  database: process.env.DB_NAME || "Main_Server",
});

function ensureProductImagesColumn() {
  db.query(
    "SHOW COLUMNS FROM product_mastery LIKE 'images'",
    (checkErr, results) => {
      if (checkErr) {
        console.error("Failed to inspect product_mastery columns:", checkErr);
        return;
      }

      if (results.length > 0) {
        return;
      }

      db.query(
        "ALTER TABLE product_mastery ADD COLUMN images TEXT NULL",
        (alterErr) => {
          if (alterErr) {
            console.error("Failed to add images column to product_mastery:", alterErr);
            return;
          }

          console.log("Added images column to product_mastery");
        }
      );
    }
  );
}

db.connect(err => {
  if (err) {
    console.error("MySQL connection error:", err);
  } else {
    console.log("Connected to MySQL");
    ensureProductImagesColumn();
  }
});

module.exports = db;
