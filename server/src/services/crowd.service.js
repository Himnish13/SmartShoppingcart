const db = require("../config/db");

exports.getCrowd = () => {
  return new Promise((res, rej) => {
    db.query("SELECT * FROM crowd_data", (e, r) =>
      e ? rej(e) : res(r)
    );
  });
};