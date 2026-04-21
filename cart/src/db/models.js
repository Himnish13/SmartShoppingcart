const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function initializeTables() {

  const dbPath = path.join(__dirname, "../../data/cart.db");

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Old DB deleted");
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {

    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE nodes (
      node_id INTEGER PRIMARY KEY,
      x REAL,
      y REAL
    )`);

    db.run(`CREATE TABLE category (
      category_id INTEGER PRIMARY KEY,
      category_name TEXT,
      node_id INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE products (
      product_id INTEGER PRIMARY KEY,
      barcode TEXT UNIQUE,
      image_url TEXT,
      name TEXT,
      price REAL,
      category_id INTEGER,
      node_id INTEGER,
      FOREIGN KEY (category_id) REFERENCES category(category_id),
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE edges (
      from_node INTEGER,
      to_node INTEGER,
      distance REAL,
      PRIMARY KEY (from_node, to_node),
      FOREIGN KEY (from_node) REFERENCES nodes(node_id),
      FOREIGN KEY (to_node) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE beacons (
      beacon_id TEXT PRIMARY KEY,
      node_id INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE offers (
      product_id INTEGER PRIMARY KEY,
      discount REAL,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`);

    db.run(`CREATE TABLE cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      price_at_scan REAL,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`);

    db.run(`CREATE TABLE shopping_list (
      product_id INTEGER,
      quantity INTEGER,
      picked INTEGER DEFAULT 0,
      picked_quantity INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`);

    db.run(`CREATE TABLE user_session (
      session_id TEXT PRIMARY KEY,
      user_id INTEGER,
      cart_id TEXT,
      started_at TEXT
    )`);

    db.run(`CREATE TABLE crowd (
      node_id INTEGER PRIMARY KEY,
      density INTEGER,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`CREATE TABLE sync_meta (
      table_name TEXT PRIMARY KEY,
      last_updated_at TEXT
    )`);

    db.run(`INSERT INTO sync_meta VALUES ('products', '1970-01-01T00:00:00Z')`);

    db.run(
      `INSERT INTO user_session (session_id, user_id, cart_id, started_at)
       VALUES (?, ?, ?, datetime('now'))`,
      ["session1", 1, "C1"]
    );

    db.run(`CREATE TABLE cart_position (
      id INTEGER PRIMARY KEY,
      node_id INTEGER,
      updated_at TEXT,
      FOREIGN KEY (node_id) REFERENCES nodes(node_id)
    )`);

    db.run(`INSERT INTO cart_position (id, node_id, updated_at)
            VALUES (1, NULL, datetime('now'))`);

    console.log("Cart DB ready with FK + category support");
  });

  return db;
}

module.exports = initializeTables;

if (require.main === module) {
  initializeTables();
}