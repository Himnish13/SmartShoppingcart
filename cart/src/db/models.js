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

    db.run(`CREATE TABLE products (
      product_id INTEGER PRIMARY KEY,
      barcode TEXT,
      name TEXT,
      category TEXT,
      price REAL,
      node_id INTEGER
    )`);

    db.run(`CREATE TABLE nodes (
      node_id INTEGER PRIMARY KEY,
      x REAL,
      y REAL
    )`);

    db.run(`CREATE TABLE edges (
      from_node INTEGER,
      to_node INTEGER,
      distance REAL
    )`);

    db.run(`CREATE TABLE beacons (
      beacon_id TEXT PRIMARY KEY,
      node_id INTEGER
    )`);

    db.run(`CREATE TABLE offers (
      offer_id INTEGER PRIMARY KEY,
      product_id INTEGER,
      node_id INTEGER,
      discount REAL
    )`);

    db.run(`CREATE TABLE cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER,
      price_at_scan REAL
    )`);

    db.run(`CREATE TABLE shopping_list (
      product_id INTEGER,
      quantity INTEGER,
      picked INTEGER DEFAULT 0,
      picked_quantity INTEGER DEFAULT 0
    )`);

    
    db.run(`CREATE TABLE user_session (
      session_id TEXT PRIMARY KEY,
      user_id INTEGER,
      cart_id TEXT,
      started_at TEXT
    )`);
    db.run(`CREATE TABLE crowd(
        node_id INTEGER,
        density INTEGER
      )`)

    db.run(`CREATE TABLE sync_meta (
      last_sync_time TEXT
    )`);

    db.run(`INSERT INTO sync_meta VALUES ('1970-01-01T00:00:00Z')`);

   
    db.run(
      `INSERT INTO user_session (session_id, user_id, cart_id, started_at)
       VALUES (?, ?, ?, datetime('now'))`,
      ["session1", 1, "C1"]
    );
    db.run(`CREATE TABLE cart_position (
      id INTEGER PRIMARY KEY,
      node_id INTEGER,
      updated_at TEXT
    )`);


    db.run(`INSERT INTO cart_position (id, node_id, updated_at)
            VALUES (1, NULL, datetime('now'))`);

    console.log("Cart DB ready with cart_id support");
  });

  return db;
}

module.exports = initializeTables;

if (require.main === module) {
  initializeTables();
}