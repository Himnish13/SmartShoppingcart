const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function ensureCartDevice(cartId) {
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
     LIMIT 1`,
    [cartId]
  );

  if (active.length === 0) {
    await query(
      `INSERT INTO cart_session (session_id, cart_id, user_id, started_at, ended_at)
       VALUES (?, ?, NULL, CURRENT_TIMESTAMP, NULL)`,
      [`${cartId}-${Date.now()}`, cartId]
    );
  }
}

async function receiveShoppingList({ cart_id, items }) {
  if (!cart_id) throw new Error("cart_id is required");
  if (!Array.isArray(items)) throw new Error("items must be an array");

  await ensureCartDevice(cart_id);

  return {
    message: "Shopping list received but not stored because server schema has no shopping-list table",
    cart_id,
    count: items.length
  };
}

async function receiveCheckout({ cart_id, items, total }) {
  if (!cart_id) throw new Error("cart_id is required");
  if (!Array.isArray(items)) throw new Error("items must be an array");

  await ensureCartDevice(cart_id);

  const orderResult = await query(
    `INSERT INTO orders (user_id, cart_id, total_amount)
     VALUES (?, ?, ?)`,
    [null, cart_id, total || 0]
  );

  const orderId = orderResult.insertId;

  if (items.length > 0) {
    const values = items.map((item) => [
      orderId,
      item.product_id,
      item.quantity || 1,
      item.price_at_scan || item.price || 0
    ]);

    await query(
      `INSERT INTO order_items
       (order_id, product_id, quantity, price_at_time)
       VALUES ?`,
      [values]
    );
  }

  await query(
    `UPDATE cart_devices SET status = 'INACTIVE', last_seen = CURRENT_TIMESTAMP
     WHERE cart_id = ?`,
    [cart_id]
  );

  return { message: "Cart checkout received", cart_id, orderId, count: items.length, total: total || 0 };
}

async function receiveCurrentCartItems({ cart_id, items, total }) {
  if (!cart_id) throw new Error("cart_id is required");
  if (!Array.isArray(items)) throw new Error("items must be an array");

  await ensureCartDevice(cart_id);

  const computedTotal = total ?? items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price_at_scan || item.price) || 0;
    return sum + qty * price;
  }, 0);

  const existingOrders = await query(
    `SELECT order_id
     FROM orders
     WHERE cart_id = ?
     ORDER BY created_at DESC, order_id DESC
     LIMIT 1`,
    [cart_id]
  );

  let orderId = existingOrders[0]?.order_id;

  if (orderId) {
    await query(
      `UPDATE orders SET total_amount = ? WHERE order_id = ?`,
      [computedTotal, orderId]
    );
    await query(`DELETE FROM order_items WHERE order_id = ?`, [orderId]);
  } else {
    const orderResult = await query(
      `INSERT INTO orders (user_id, cart_id, total_amount)
       VALUES (?, ?, ?)`,
      [null, cart_id, computedTotal]
    );
    orderId = orderResult.insertId;
  }

  if (items.length > 0) {
    const values = items.map((item) => [
      orderId,
      item.product_id,
      item.quantity || 1,
      item.price_at_scan || item.price || 0
    ]);

    await query(
      `INSERT INTO order_items
       (order_id, product_id, quantity, price_at_time)
       VALUES ?`,
      [values]
    );
  }

  return {
    message: "Current cart items synced to orders",
    cart_id,
    orderId,
    count: items.length,
    total: computedTotal
  };
}

async function receivePosition({ cart_id, node_id }) {
  if (!cart_id) throw new Error("cart_id is required");
  if (!node_id) throw new Error("node_id is required");

  await ensureCartDevice(cart_id);

  return {
    message: "Cart position heartbeat received",
    cart_id,
    node_id
  };
}

module.exports = {
  receiveShoppingList,
  receiveCheckout,
  receiveCurrentCartItems,
  receivePosition
};
