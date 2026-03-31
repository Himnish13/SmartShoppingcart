const db = require("../config/db");

const getNodes = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM nodes", (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getEdges = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM edges", (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getPOI = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.name,
        c.node_id
      FROM product_mastery p
      LEFT JOIN category c 
        ON p.category_id = c.category_id
    `;

    db.query(query, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  getNodes,
  getEdges,
  getPOI
};