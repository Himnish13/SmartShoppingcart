const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
