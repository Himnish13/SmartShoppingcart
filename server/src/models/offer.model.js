const db = require("../config/db");

exports.addOffer = (data) => {
  return new Promise((res, rej) => {
    db.query(
      "INSERT INTO offers VALUES (?, ?, ?, ?, NOW())",
      [data.product_id, data.discount_percent, data.valid_from, data.valid_until],
      (e, r) => (e ? rej(e) : res(r))
    );
  });
};

exports.updateOffer = (id, data) => {
  return new Promise((res, rej) => {
    db.query(
      "UPDATE offers SET discount_percent=? WHERE product_id=?",
      [data.discount_percent, id],
      (e, r) => (e ? rej(e) : res(r))
    );
  });
};

exports.deleteOffer = (id) => {
  return new Promise((res, rej) => {
    db.query("DELETE FROM offers WHERE product_id=?", [id], (e, r) =>
      e ? rej(e) : res(r)
    );
  });
};