const axios = require("axios");
const db = require("../config/sqlite");

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3200";

function getCartId() {
  return new Promise((resolve) => {
    db.get(`SELECT cart_id FROM user_session LIMIT 1`, (err, row) => {
      if (err || !row) return resolve("C1");
      resolve(row.cart_id || "C1");
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

exports.sendShoppingList = async () => {
  const cart_id = await getCartId();
  const rows = await all(
    `SELECT
       s.product_id,
       p.name,
       p.barcode,
       s.quantity,
       s.picked
     FROM shopping_list s
     JOIN products p ON s.product_id = p.product_id`
  );

  const response = await axios.post(`${SERVER_URL}/shopping-list`, {
    cart_id,
    items: rows
  });

  return response.data;
};

exports.sendCurrentCartItems = async () => {
  const cart_id = await getCartId();
  const rows = await all(`SELECT product_id, quantity, price_at_scan FROM cart_items`);

  const total = rows.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.price_at_scan) || 0;
    return sum + qty * price;
  }, 0);

  const response = await axios.post(`${SERVER_URL}/cart/items`, {
    cart_id,
    items: rows,
    total
  });

  return response.data;
};

exports.sendCheckout = async () => {
  const cart_id = await getCartId();
  const rows = await all(`SELECT product_id, quantity, price_at_scan FROM cart_items`);

  const total = rows.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.price_at_scan) || 0;
    return sum + qty * price;
  }, 0);

  const response = await axios.post(`${SERVER_URL}/cart/checkout`, {
    cart_id,
    items: rows,
    total
  });

  return response.data;
};

exports.getCurrentPositionNode = async () => {
  const rows = await all(`SELECT node_id FROM cart_position WHERE id = 1`);
  return rows[0]?.node_id || null;
};

exports.sendPosition = async (node_id) => {
  const cart_id = await getCartId();
  const response = await axios.post(`${SERVER_URL}/cart-position`, {
    cart_id,
    node_id,
    timestamp: new Date().toISOString()
  });

  try {
    await axios.post(`${SERVER_URL}/crowd/increment`, {
      node_id,
      cart_id
    });
  } catch (err) {
    return {
      ...response.data,
      crowd_warning: err.response?.data || err.message
    };
  }

  return {
    ...response.data,
    crowd: "updated"
  };
};

exports.sendFeedback = async () => {
  const cart_id = await getCartId();
  const rows = await all(
    `SELECT feedback_id, product_name, product_id, message, created_at
     FROM feedback
     WHERE synced = 0`
  );

  if (rows.length === 0) {
    return { message: "No feedback to sync", cart_id, count: 0 };
  }

  const response = await axios.post(`${SERVER_URL}/feedback/bulk`, {
    cart_id,
    feedbacks: rows
  });

  const ids = rows.map((row) => row.feedback_id);
  await run(
    `UPDATE feedback SET synced = 1
     WHERE feedback_id IN (${ids.map(() => "?").join(",")})`,
    ids
  );

  return {
    ...response.data,
    cart_id,
    count: rows.length
  };
};
