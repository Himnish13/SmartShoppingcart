const mysql = require("mysql2");

const db = mysql.createPool(process.env.MYSQL_URL);

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
            console.error(
              "Failed to add images column to product_mastery:",
              alterErr
            );
            return;
          }

          console.log("Added images column to product_mastery");
        }
      );
    }
  );
}

db.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }

  console.log("Connected to MySQL");
  connection.release();

  ensureProductImagesColumn();
});

module.exports = db;