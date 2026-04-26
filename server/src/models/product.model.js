const db = require("../config/db");

function getCategoryIdByName(categoryName) {
  return new Promise((resolve, reject) => {
    const query = `SELECT category_id FROM category WHERE LOWER(category_name) = LOWER(?)`;
    db.query(query, [categoryName], (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0].category_id : null);
    });
  });
}

function getOrCreateCategoryId(categoryName) {
  return new Promise(async (resolve, reject) => {
    try {
      // First, try to find the category
      const categoryId = await getCategoryIdByName(categoryName);
      if (categoryId) {
        return resolve(categoryId);
      }

      // If category doesn't exist, create it
      const insertQuery = `INSERT INTO category (category_name) VALUES (?)`;
      db.query(insertQuery, [categoryName], (err, results) => {
        if (err) return reject(err);
        resolve(results.insertId);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function getAllProductsFromDB() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT
        p.product_id,
        p.barcode,
        p.name,
        p.price,
        p.stock,
        c.category_name,
        c.node_id,
        p.is_active,
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
        p.stock,
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
  return new Promise(async (resolve, reject) => {
    try {
      let categoryId = data.category_id;

      // If category_id is a string (category name), get or create it
      if (typeof categoryId === 'string' && categoryId) {
        categoryId = await getOrCreateCategoryId(categoryId);
      }

      const stock = Number(data.stock) || 0;

      const query = `
        INSERT INTO product_mastery
        (barcode, name, price, category_id, stock, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `;

      db.query(
        query,
        [data.barcode, data.name, data.price, categoryId, stock],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

function updateProduct(id, data) {
  return new Promise(async (resolve, reject) => {
    try {
      let categoryId = data.category_id;

      // If category_id is a string (category name), get or create it
      if (typeof categoryId === 'string' && categoryId) {
        categoryId = await getOrCreateCategoryId(categoryId);
      }

      const query = `
        UPDATE product_mastery
        SET name = ?, price = ?, category_id = ?, stock = ?, is_active = ?
        WHERE product_id = ?
      `;

      db.query(
        query,
        [data.name, data.price, categoryId, data.stock, data.is_active, id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    } catch (err) {
      reject(err);
    }
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