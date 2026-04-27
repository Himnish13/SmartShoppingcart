const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function getActiveCartsFromDB() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT cs.*, cd.status, cd.last_seen, u.phone_number 
       FROM cart_session cs
       LEFT JOIN cart_devices cd ON cs.cart_id = cd.cart_id
       LEFT JOIN users u ON cs.user_id = u.user_id
       WHERE cs.ended_at IS NULL`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

function getCartItems(cartId) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT oi.product_id as productId, oi.quantity as qty
       FROM orders o
       JOIN order_items oi ON o.order_id = oi.order_id
       WHERE o.cart_id = ?
       AND o.order_id = (
         SELECT MAX(order_id) FROM orders WHERE cart_id = ?
       )`,
      [cartId, cartId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

async function getCartDevices() {
  return await query(
    `SELECT
       cd.cart_id,
       cd.status,
       cd.last_seen,
       cd.firmware_version,
       cs.session_id,
       cs.user_id,
       cs.started_at,
       cs.ended_at
     FROM cart_devices cd
     LEFT JOIN cart_session cs
       ON cd.cart_id = cs.cart_id
      AND cs.ended_at IS NULL
     ORDER BY cd.cart_id`
  );
}

async function startCartSession(cartId, userId = null) {
  if (!cartId) throw new Error("cart_id is required");

  await query(
    `INSERT IGNORE INTO cart_devices (cart_id, status, last_seen)
     VALUES (?, 'ACTIVE', CURRENT_TIMESTAMP)`,
    [cartId]
  );

  await query(
    `UPDATE cart_devices
     SET status = 'ACTIVE', last_seen = CURRENT_TIMESTAMP
     WHERE cart_id = ?`,
    [cartId]
  );

  const active = await query(
    `SELECT session_id FROM cart_session
     WHERE cart_id = ? AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [cartId]
  );

  if (active.length > 0) {
    return { cart_id: cartId, session_id: active[0].session_id, status: "ACTIVE", reused: true };
  }

  const sessionId = `${cartId}-${Date.now()}`;
  await query(
    `INSERT INTO cart_session (session_id, cart_id, user_id, started_at, ended_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, NULL)`,
    [sessionId, cartId, userId || null]
  );

  return { cart_id: cartId, session_id: sessionId, status: "ACTIVE", reused: false };
}

async function stopCartSession(cartId) {
  if (!cartId) throw new Error("cart_id is required");

  await query(
    `UPDATE cart_session
     SET ended_at = CURRENT_TIMESTAMP
     WHERE cart_id = ? AND ended_at IS NULL`,
    [cartId]
  );

  await query(
    `UPDATE cart_devices
     SET status = 'INACTIVE', last_seen = CURRENT_TIMESTAMP
     WHERE cart_id = ?`,
    [cartId]
  );

  return { cart_id: cartId, status: "INACTIVE" };
}

module.exports = {
  getActiveCartsFromDB,
  getCartItems,
  getCartDevices,
  startCartSession,
  stopCartSession
};
