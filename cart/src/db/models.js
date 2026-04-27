const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function initializeTables() {

  const dbPath = path.join(__dirname, "../../data/cart.db");

  if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {

    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE IF NOT EXISTS nodes (
      node_id INTEGER PRIMARY KEY,
      x REAL,
      y REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS category (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT,
      node_id INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    // ✅ UPDATED DEFAULT STOCK = 20
    db.run(`CREATE TABLE IF NOT EXISTS products (
      product_id INTEGER PRIMARY KEY,
      barcode TEXT UNIQUE,
      image_url TEXT,
      name TEXT,
      price REAL,
      stock INTEGER DEFAULT 20,
      category_id INTEGER,
      node_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES category(category_id),
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS edges (
      from_node INTEGER,
      to_node INTEGER,
      distance REAL,
      PRIMARY KEY (from_node, to_node),
      FOREIGN KEY (from_node) REFERENCES nodes(node_id),
      FOREIGN KEY (to_node) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS beacons (
      beacon_id TEXT PRIMARY KEY,
      node_id INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS offers (
      product_id INTEGER PRIMARY KEY,
      discount REAL,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      price_at_scan REAL,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS shopping_list (
      product_id INTEGER,
      quantity INTEGER,
      picked INTEGER DEFAULT 0,
      picked_quantity INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_session (
      session_id TEXT PRIMARY KEY,
      user_id INTEGER,
      cart_id TEXT,
      started_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS crowd (
      node_id INTEGER PRIMARY KEY,
      density INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sync_meta (
      table_name TEXT PRIMARY KEY,
      last_updated_at TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cart_position (
      id INTEGER PRIMARY KEY,
      node_id INTEGER,
      updated_at TEXT,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    // ✅ FEEDBACK TABLE
    db.run(`CREATE TABLE IF NOT EXISTS feedback (
      feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT,
      product_id INTEGER,
      message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    )`);

    console.log("Cart DB schema ready; data will come from server sync");
  });

  return db;
}

module.exports = initializeTables;

if (require.main === module) {
  initializeTables();
}
