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
    const { user_id, cart_id, items, status, customer, total, subtotal } = orderData;

    let totalAmount = total || 0;
    if (!totalAmount && items && items.length) {
      items.forEach(i => totalAmount += (i.quantity || i.qty || 0) * (i.price || 0));
    }

    db.query(
      `INSERT INTO orders (user_id, cart_id, total_amount, status)
       VALUES (?, ?, ?, ?)`,
      [user_id || 1, cart_id || null, totalAmount, status || 'completed'],
      (err, result) => {
        if (err) return reject(err);

        const orderId = result.insertId;

        const finalStatus = status || 'completed';
        const finishOrder = () => {
          if ((finalStatus === 'paid' || finalStatus === 'completed') && cart_id && user_id) {
            db.query(`UPDATE cart_session SET ended_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND user_id = ? AND ended_at IS NULL`, [cart_id, user_id], () => {
              db.query(`UPDATE cart_devices SET status = 'inactive' WHERE cart_id = ?`, [cart_id], () => {
                resolve({ orderId });
              });
            });
          } else {
            resolve({ orderId });
          }
        };

        if (items && items.length) {
          const values = items.map(i => [
            orderId,
            i.product_id || 0,
            i.quantity || i.qty || 1,
            i.price || 0
          ]);

          db.query(
            `INSERT INTO order_items 
             (order_id, product_id, quantity, price_at_time)
             VALUES ?`,
            [values],
            (err) => {
              if (err) return reject(err);
              finishOrder();
            }
          );
        } else {
          finishOrder();
        }
      }
    );
  });
}

function updateOrder(orderId, orderData) {
  return new Promise((resolve, reject) => {
    const { status, total, total_amount } = orderData;
    const amount = total || total_amount;

    let query = 'UPDATE orders SET status = ?';
    const params = [status || 'completed'];

    if (amount !== undefined) {
      query += ', total_amount = ?';
      params.push(amount);
    }

    query += ' WHERE order_id = ?';
    params.push(orderId);

    db.query(query, params, (err, result) => {
      if (err) return reject(err);

      // If marked as paid or completed, end the associated cart session
      if (status === 'paid' || status === 'completed') {
        db.query(
          `UPDATE cart_session cs
           JOIN orders o ON cs.cart_id = o.cart_id AND cs.user_id = o.user_id
           SET cs.ended_at = CURRENT_TIMESTAMP
           WHERE o.order_id = ? AND cs.ended_at IS NULL`,
          [orderId],
          (err2) => {
            if (err2) console.error("Failed to end cart session:", err2);
            
            // Also mark cart_devices as inactive
            db.query(
              `UPDATE cart_devices cd
               JOIN orders o ON cd.cart_id = o.cart_id
               SET cd.status = 'inactive'
               WHERE o.order_id = ?`,
              [orderId],
              (err3) => {
                if (err3) console.error("Failed to update cart device status:", err3);
                resolve({ success: true, orderId });
              }
            );
          }
        );
      } else {
        resolve({ success: true, orderId });
      }
    });
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