const db = require("../config/db");

function getProductsWithFeedbackCount() {
  return new Promise((resolve, reject) => {
    // We get products with most feedback requests, mapping NULL product_id to 0 for frontend compatibility
    const query = `
      SELECT 
        COALESCE(CAST(product_id AS CHAR), product_name, 'general') as product_id, 
        COALESCE(MAX(product_name), 'General Feedback') as name, 
        COUNT(feedback_id) as feedback_count
      FROM feedback
      GROUP BY COALESCE(CAST(product_id AS CHAR), product_name, 'general')
      ORDER BY feedback_count DESC
    `;
    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function getFeedbackByProductId(productId) {
  return new Promise((resolve, reject) => {
    const isNumericId = !isNaN(productId) && productId !== 'general';
    let query = '';
    let params = [];

    if (isNumericId) {
      query = `SELECT feedback_id, cart_id, message, created_at FROM feedback WHERE product_id = ? ORDER BY created_at DESC`;
      params = [productId];
    } else if (productId === 'general') {
      query = `SELECT feedback_id, cart_id, message, created_at FROM feedback WHERE product_id IS NULL AND (product_name IS NULL OR product_name = 'General Feedback' OR product_name = 'general') ORDER BY created_at DESC`;
    } else {
      query = `SELECT feedback_id, cart_id, message, created_at FROM feedback WHERE product_id IS NULL AND product_name = ? ORDER BY created_at DESC`;
      params = [productId];
    }

    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function addFeedback(data) {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO feedback (cart_id, product_name, product_id, message)
      VALUES (?, ?, ?, ?)
    `;
    db.query(
      query, 
      [data.cart_id, data.product_name, data.product_id, data.message], 
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

module.exports = {
  getProductsWithFeedbackCount,
  getFeedbackByProductId,
  addFeedback
};
