const db = require("../config/db");

function getActiveCartsFromDB() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM cart_session WHERE ended_at IS NULL`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

module.exports = {
  getActiveCartsFromDB
};