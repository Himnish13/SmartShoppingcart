const db = require("../config/db");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// Helper function to adjust product stock
async function adjustStock(productId, quantityChange) {
  const newQuantity = Math.abs(quantityChange);
  const operation = quantityChange > 0 ? "+" : "-";

  try {
    await query(
      `UPDATE product_mastery
       SET stock = stock ${operation} ?
       WHERE product_id = ?`,
      [newQuantity, productId]
    );
    return true;
  } catch (err) {
    console.error(`Failed to adjust stock for product ${productId}:`, err);
    throw new Error(`Stock adjustment failed for product ${productId}`);
  }
}

// Get current items in a cart (not removed)
async function getCartCurrentItems(cartId) {
  return await query(
    `SELECT product_id, quantity, price_at_scan
     FROM cart_items
     WHERE cart_id = ? AND removed_at IS NULL`,
    [cartId]
  );
}

// Add item to cart_items tracking table
async function addCartItem(cartId, productId, quantity, priceAtScan) {
  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, price_at_scan)
     VALUES (?, ?, ?, ?)`,
    [cartId, productId, quantity, priceAtScan]
  );
}

// Update tracked quantity for an active cart item
async function updateCartItem(cartId, productId, quantity, priceAtScan) {
  await query(
    `UPDATE cart_items
     SET quantity = ?, price_at_scan = ?
     WHERE cart_id = ? AND product_id = ? AND removed_at IS NULL`,
    [quantity, priceAtScan, cartId, productId]
  );
}

// Mark item as removed from cart
async function removeCartItem(cartId, productId) {
  await query(
    `UPDATE cart_items
     SET removed_at = CURRENT_TIMESTAMP
     WHERE cart_id = ? AND product_id = ? AND removed_at IS NULL`,
    [cartId, productId]
  );
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

    // Mark all cart items as checked out (removed from active cart)
    for (const item of items) {
      await removeCartItem(cart_id, item.product_id);
    }
  }

  await query(
    `UPDATE cart_devices SET status = 'INACTIVE', last_seen = CURRENT_TIMESTAMP
     WHERE cart_id = ?`,
    [cart_id]
  );

  return { message: "Cart checkout received and cart items finalized", cart_id, orderId, count: items.length, total: total || 0 };
}

async function receiveCurrentCartItems({ cart_id, items, total }) {
  if (!cart_id) throw new Error("cart_id is required");
  if (!Array.isArray(items)) throw new Error("items must be an array");

  await ensureCartDevice(cart_id);

  // Get previously tracked items in cart (items that weren't removed)
  const previousItems = await getCartCurrentItems(cart_id);
  const previousItemsMap = new Map(previousItems.map((item) => [item.product_id, item]));

  // Create map of new items
  const newItemsMap = new Map(
    items.map((item) => [
      item.product_id,
      { quantity: item.quantity || 1, price_at_scan: item.price_at_scan || item.price || 0 }
    ])
  );

  // Detect added items (new items not in previous cart)
  for (const [productId, newItem] of newItemsMap) {
    const previousItem = previousItemsMap.get(productId);
    if (!previousItem) {
      // Item is newly added
      try {
        await adjustStock(productId, -newItem.quantity); // Decrease stock
        await addCartItem(cart_id, productId, newItem.quantity, newItem.price_at_scan);
        console.log(`Stock decreased for product ${productId} by ${newItem.quantity}`);
      } catch (err) {
        console.error(`Failed to process added item ${productId}:`, err);
        throw err;
      }
    } else if (previousItem.quantity !== newItem.quantity) {
      // Quantity changed - adjust stock difference
      const quantityDifference = newItem.quantity - previousItem.quantity;
      try {
        await adjustStock(productId, -quantityDifference); // Negative for decrease, positive for increase
        await updateCartItem(cart_id, productId, newItem.quantity, newItem.price_at_scan);
        console.log(`Stock adjusted for product ${productId} by ${-quantityDifference}`);
      } catch (err) {
        console.error(`Failed to adjust stock for product ${productId}:`, err);
        throw err;
      }
    }
  }

  // Detect removed items (previous items not in new cart)
  for (const [productId, previousItem] of previousItemsMap) {
    if (!newItemsMap.has(productId)) {
      // Item was removed from cart
      try {
        await adjustStock(productId, previousItem.quantity); // Increase stock back
        await removeCartItem(cart_id, productId);
        console.log(`Stock increased for product ${productId} by ${previousItem.quantity}`);
      } catch (err) {
        console.error(`Failed to process removed item ${productId}:`, err);
        throw err;
      }
    }
  }

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
    message: "Current cart items synced to orders with stock management",
    cart_id,
    orderId,
    count: items.length,
    total: computedTotal,
    stockAdjustmentsApplied: true
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
  receivePosition,
  adjustStock,
  getCartCurrentItems,
  addCartItem,
  updateCartItem,
  removeCartItem
};
