const db = require("../config/db");

const getLastUpdatedTimeByTable = (tableName) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT last_updated_at 
       FROM sync_meta 
       WHERE table_name = ?`,
      [tableName],
      (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.last_updated_at || "1970-01-01 00:00:00");
      }
    );
  });
};

const getProducts = (lastUpdated) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.barcode,
        p.name,
        p.price,
        c.node_id,
        p.updated_at
      FROM product_mastery p
      LEFT JOIN category c 
        ON p.category_id = c.category_id
      WHERE p.updated_at >= ?
    `;

    db.query(query, [lastUpdated], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const getOffers = (lastUpdated) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM offers WHERE updated_at >= ?`,
      [lastUpdated],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

const getCrowd = (lastUpdated) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM crowd_data WHERE updated_at >= ?`,
      [lastUpdated],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};
const getNodesUpdated = (lastUpdated) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM nodes WHERE updated_at >= ?`,
      [lastUpdated],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};
const getEdgesUpdated = (lastUpdated) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM edges WHERE updated_at >= ?`,
      [lastUpdated],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};
const getCategories = (lastUpdated) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM category WHERE updated_at >= ?`,
      [lastUpdated],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};
module.exports = {
  getLastUpdatedTimeByTable,
  getProducts,
  getOffers,
  getCrowd,
  getNodesUpdated,
  getEdgesUpdated,
  getCategories
};