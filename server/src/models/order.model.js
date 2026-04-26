const db = require("../config/db");

function getOrders() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM orders ORDER BY created_at DESC`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

function getOrderItems(orderId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
        oi.product_id,
        p.name,
        oi.quantity,
        oi.price_at_time
      FROM order_items oi
      JOIN product_mastery p 
        ON oi.product_id = p.product_id
      WHERE oi.order_id = ?`,
      [orderId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}
function createOrder(orderData) {
  return new Promise((resolve, reject) => {
    const { user_id, cart_id, items } = orderData;

    let total = 0;
    items.forEach(i => total += i.quantity * i.price);

    db.query(
      `INSERT INTO orders (user_id, cart_id, total_amount)
       VALUES (?, ?, ?)`,
      [user_id, cart_id, total],
      (err, result) => {
        if (err) return reject(err);

        const orderId = result.insertId;

        const values = items.map(i => [
          orderId,
          i.product_id,
          i.quantity,
          i.price
        ]);

        db.query(
          `INSERT INTO order_items 
           (order_id, product_id, quantity, price_at_time)
           VALUES ?`,
          [values],
          (err) => {
            if (err) return reject(err);

            // 🔥 STOCK UPDATE
            items.forEach(item => {
              db.query(
                `UPDATE product_mastery 
                 SET stock = stock - ?
                 WHERE product_id = ?`,
                [item.quantity, item.product_id]
              );
            });

            resolve({ orderId });
          }
        );
      }
    );
  });
}

function updateOrder(orderId, orderData) {
  return new Promise((resolve, reject) => {
    const { status } = orderData;

    db.query(
      `UPDATE orders SET status = ? WHERE order_id = ?`,
      [status || "pending", orderId],
      (err, result) => {
        if (err) return reject(err);
        resolve({ success: true, orderId });
      }
    );
  });
}

function deleteOrder(orderId) {
  return new Promise((resolve, reject) => {
    db.query(
      `DELETE FROM orders WHERE order_id = ?`,
      [orderId],
      (err, result) => {
        if (err) return reject(err);
        resolve({ success: true, orderId });
      }
    );
  });
}

module.exports = {
  getOrders,
  getOrderItems,
  createOrder,
  updateOrder,
  deleteOrder
};