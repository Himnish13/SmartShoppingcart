const db = require("../config/db");

function getActiveCartsFromDB() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT cs.*, u.phone_number 
       FROM cart_session cs
       LEFT JOIN users u ON cs.user_id = u.user_id
       WHERE cs.ended_at IS NULL`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

function getCartItems(cartId, userId) {
  return new Promise((resolve, reject) => {
    // Assuming active cart items are stored in orders with the cart_id and user_id
    db.query(
      `SELECT oi.product_id as productId, oi.quantity as qty
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       WHERE o.cart_id = ? AND o.user_id = ?
       ORDER BY o.created_at DESC`,
      [cartId, userId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

module.exports = {
  getActiveCartsFromDB,
  getCartItems
};