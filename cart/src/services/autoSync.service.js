const axios = require("axios");
const syncService = require("./sync.service");

const SERVER_URL = process.env.SERVER_URL;
const SERVER_TO_CART_SYNC_MS = Number(
  process.env.SERVER_TO_CART_SYNC_MS || 300000
); // 5 min

const CART_TO_SERVER_SYNC_MS = Number(
  process.env.CART_TO_SERVER_SYNC_MS || 60000
); // 1 min

let pulling = false;
let pushing = false;
let lastPositionNode = null;
const db = require("../config/sqlite");

async function pullServerDataToCart() {
  if (pulling) return;
  pulling = true;

  try {
    const response = await axios.get(`${SERVER_URL}/sync/full`);

    const {
      products = [],
      categories = [],
      nodes = [],
      edges = [],
      beacons = [],
      offers = [],
      crowd = []
    } = response.data;

    console.log("Server → Cart sync successful", {
      products: products.length,
      offers: offers.length,
      crowd: crowd.length,
      nodes: nodes.length,
      edges: edges.length,
    });

    db.serialize(() => {
      db.run("PRAGMA foreign_keys = OFF");

      db.run(`DELETE FROM offers`);
      db.run(`DELETE FROM beacons`);
      db.run(`DELETE FROM edges`);
      db.run(`DELETE FROM products`);
      db.run(`DELETE FROM category`);
      db.run(`DELETE FROM nodes`);
      db.run(`DELETE FROM crowd`);

      db.run("PRAGMA foreign_keys = ON");

      nodes.forEach((n) => {
        db.run(
          `INSERT INTO nodes (node_id,x,y) VALUES (?,?,?)`,
          [n.node_id, n.x_coordinate ?? n.x, n.y_coordinate ?? n.y]
        );
      });

      categories.forEach((c) => {
        db.run(
          `INSERT INTO category (category_id,category_name,node_id)
           VALUES (?,?,?)`,
          [c.category_id, c.category_name, c.node_id]
        );
      });

      products.forEach((p) => {
        db.run(
          `INSERT INTO products
          (product_id, barcode, image_url, name, price, stock, category_id, node_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.product_id,
            p.barcode,
            p.image_url ?? null,
            p.name,
            p.price,
            p.stock ?? 20,
            p.category_id ?? null,
            p.node_id ?? null,
          ]
        );
      });

      edges.forEach((e) => {
        db.run(
          `INSERT INTO edges (from_node,to_node,distance)
           VALUES (?,?,?)`,
          [e.from_node, e.to_node, e.distance]
        );
      });

      beacons.forEach((b) => {
        db.run(
          `INSERT INTO beacons (beacon_id,node_id)
           VALUES (?,?)`,
          [b.beacon_id, b.node_id]
        );
      });

      offers.forEach((o) => {
        db.run(
          `INSERT INTO offers (product_id,discount)
           VALUES (?,?)`,
          [o.product_id, o.discount_percent ?? o.discount]
        );
      });

      crowd.forEach((c) => {
        db.run(
          `INSERT INTO crowd (node_id,density)
           VALUES (?,?)`,
          [c.node_id, c.crowd_level ?? c.density]
        );
      });

      db.get(
        "SELECT COUNT(*) as cnt FROM products",
        [],
        (err, row) => {
          if (!err) {
            console.log("Products after sync =", row.cnt);
          }
        }
      );
    });

  } catch (err) {
    console.error(
      "Server → Cart sync failed:",
      err.response?.data || err.message
    );
  } finally {
    pulling = false;
  }
}

async function pushCartDataToServer() {
  if (pushing) return;
  pushing = true;

  try {
    const results = {};

    try {
      results.shoppingList = await syncService.sendShoppingList();
    } catch (err) {
      results.shoppingList = {
        warning: err.response?.data || err.message,
      };
    }

    try {
      results.cartItems = await syncService.sendCurrentCartItems();
    } catch (err) {
      results.cartItems = {
        warning: err.response?.data || err.message,
      };
    }

    try {
      results.feedback = await syncService.sendFeedback();
    } catch (err) {
      results.feedback = {
        warning: err.response?.data || err.message,
      };
    }

    const nodeId = await syncService.getCurrentPositionNode();

    if (nodeId && nodeId !== lastPositionNode) {
      results.position = await syncService.sendPosition(nodeId);
      lastPositionNode = nodeId;
    }

    console.log("Cart → Server sync successful", {
      shoppingList:
        results.shoppingList.count ??
        results.shoppingList.warning ??
        0,

      cartItems:
        results.cartItems.count ??
        results.cartItems.warning ??
        0,

      feedback:
        results.feedback.count ??
        results.feedback.warning ??
        0,

      position: results.position?.node_id || null,
    });
  } catch (err) {
    console.error(
      "Cart → Server sync failed:",
      err.response?.data || err.message
    );
  } finally {
    pushing = false;
  }
}

function startAutoSync() {
  if (process.env.AUTO_SYNC_ENABLED === "false") {
    console.log("Auto sync disabled");
    return;
  }

  if (!SERVER_URL) {
    console.error("SERVER_URL is not configured");
    return;
  }

  setTimeout(pullServerDataToCart, 2000);
  setTimeout(pushCartDataToServer, 4000);

  setInterval(pullServerDataToCart, SERVER_TO_CART_SYNC_MS);
  setInterval(pushCartDataToServer, CART_TO_SERVER_SYNC_MS);

  console.log("Auto sync enabled", {
    serverUrl: SERVER_URL,
    serverToCartMs: SERVER_TO_CART_SYNC_MS,
    cartToServerMs: CART_TO_SERVER_SYNC_MS,
  });
}

module.exports = {
  startAutoSync,
  pullServerDataToCart,
  pushCartDataToServer,
};