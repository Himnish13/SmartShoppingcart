const db = require("../config/db");

function getAllProductsFromDB() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.barcode,
        p.name,
        p.price,
        c.category_name,
        c.node_id,
        p.updated_at
      FROM product_mastery p
      LEFT JOIN category c 
        ON p.category_id = c.category_id
      WHERE p.is_active = 1
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function getProductByBarcodeFromDB(barcode) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.barcode,
        p.name,
        p.price,
        c.category_name,
        c.node_id
      FROM product_mastery p
      LEFT JOIN category c 
        ON p.category_id = c.category_id
      WHERE p.barcode = ?
      AND p.is_active = 1
    `;

    db.query(query, [barcode], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] || null);
    });
  });
}

function searchProductsFromDB(name, category) {
  return new Promise((resolve, reject) => {

    let query = `
      SELECT 
        p.product_id,
        p.barcode,
        p.name,
        p.price,
        c.category_name,
        c.node_id
      FROM product_mastery p
      LEFT JOIN category c 
        ON p.category_id = c.category_id
      WHERE p.is_active = 1
    `;

    let params = [];

    if (name) {
      query += " AND p.name LIKE ?";
      params.push(`%${name}%`);
    }

    if (category) {
      query += " AND c.category_name = ?";
      params.push(category);
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

module.exports = {
  getAllProductsFromDB,
  getProductByBarcodeFromDB,
  searchProductsFromDB
};