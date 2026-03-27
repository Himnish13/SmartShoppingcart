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

    // ✅ products (will be filled after sync)
    db.run(`
      CREATE TABLE products (
        product_id INTEGER PRIMARY KEY,
        barcode TEXT UNIQUE,
        name TEXT,
        category TEXT,
        price REAL,
        node_id INTEGER
      )
    `);

    // ✅ nodes (routing)
    db.run(`
      CREATE TABLE nodes (
        node_id INTEGER PRIMARY KEY,
        x REAL,
        y REAL
      )
    `);

    // ✅ edges (graph)
    db.run(`
      CREATE TABLE edges (
        from_node INTEGER,
        to_node INTEGER,
        distance REAL
      )
    `);

    // ✅ beacons
    db.run(`
      CREATE TABLE beacons (
        beacon_id TEXT PRIMARY KEY,
        node_id INTEGER
      )
    `);

    // ✅ cart_items
    db.run(`
      CREATE TABLE cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        price_at_scan REAL
      )
    `);

    // ✅ shopping_list
    db.run(`
      CREATE TABLE shopping_list (
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        picked INTEGER DEFAULT 0,
        picked_quantity INTEGER DEFAULT 0
      )
    `);

    // ✅ user_session
    db.run(`
      CREATE TABLE user_session (
        session_id TEXT PRIMARY KEY,
        user_id INTEGER,
        started_at TEXT
      )
    `);

    // ✅ sync_meta
    db.run(`
      CREATE TABLE sync_meta (
        last_sync_time TEXT
      )
    `);

    db.run(
      `INSERT INTO sync_meta (last_sync_time) VALUES (?)`,
      ["1970-01-01T00:00:00"]
    );

    console.log("Cart DB initialized with all tables (empty)");
  });
}

module.exports = initializeTables;