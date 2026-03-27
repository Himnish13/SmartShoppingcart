const db = require("../config/db");

function fetchProducts(lastSync) {
  return new Promise((resolve, reject) => {

    let query = `
      SELECT 
        p.product_id,
        p.barcode,
        p.name,
        p.category,
        p.price,
        pl.node_id,
        p.updated_at
      FROM product_mastery p
      JOIN product_location pl 
        ON p.product_id = pl.product_id
    `;

    let values = [];

    if (lastSync) {
      query += ` WHERE p.updated_at > ?`;
      values.push(lastSync);
    }

    db.query(query, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function fetchMap() {
  return new Promise((resolve, reject) => {

    db.query("SELECT * FROM nodes", (err, nodes) => {
      if (err) return reject(err);

      db.query("SELECT * FROM edges", (err, edges) => {
        if (err) return reject(err);

        resolve({ nodes, edges });
      });
    });
  });
}

module.exports = { fetchProducts, fetchMap };