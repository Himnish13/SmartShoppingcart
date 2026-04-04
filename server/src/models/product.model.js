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
      query += " AND LOWER(p.name) LIKE LOWER(?)";
      params.push(`%${name}%`);
    }

    if (category) {
      query += " AND LOWER(c.category_name) LIKE LOWER(?)";
      params.push(`%${category}%`);
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function insertProduct(data) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO product_mastery 
      (barcode, name, price, category_id, is_active)
      VALUES (?, ?, ?, ?, 1)
    `;

    db.query(
      query,
      [data.barcode, data.name, data.price, data.category_id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

function updateProduct(id, data) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE product_mastery 
      SET name = ?, price = ?, category_id = ?
      WHERE product_id = ?
    `;

    db.query(
      query,
      [data.name, data.price, data.category_id, id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

function toggleProduct(id, status) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE product_mastery 
      SET is_active = ?
      WHERE product_id = ?
    `;

    db.query(query, [status, id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function updateStock(id, stock) {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE product_mastery 
      SET stock = ?
      WHERE product_id = ?
    `;

    db.query(query, [stock, id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    const query = `
      DELETE FROM product_mastery 
      WHERE product_id = ?
    `;

    db.query(query, [id], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

module.exports = {
  getAllProductsFromDB,
  getProductByBarcodeFromDB,
  searchProductsFromDB,
  insertProduct,
  updateProduct,
  toggleProduct,
  updateStock,
  deleteProduct
};