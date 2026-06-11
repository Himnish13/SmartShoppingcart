const axios = require("axios");
const db = require("../config/sqlite");
const syncService = require("../services/sync.service");
const { attachLocalImageUrls } = require("../services/productImage.service");

const SERVER_URL = process.env.SERVER_URL;

if (!SERVER_URL) {
    throw new Error("SERVER_URL not configured");
}

exports.fullSync = async (req, res) => {
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

        const productsWithLocalImages = await attachLocalImageUrls(products);

        console.log("SYNC DATA COUNTS:", {
            products: products.length,
            categories: categories.length,
            nodes: nodes.length,
            edges: edges.length,
            beacons: beacons.length,
            offers: offers.length,
            crowd: crowd.length
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
                    `INSERT INTO nodes (node_id, x, y)
                     VALUES (?, ?, ?)`,
                    [n.node_id, n.x_coordinate ?? n.x, n.y_coordinate ?? n.y],
                    (err) => {
                        if (err) {
                            console.error("NODE INSERT ERROR:", err.message);
                        }
                    }
                );
            });

            categories.forEach((c) => {
                db.run(
                    `INSERT INTO category (category_id, category_name, node_id)
                     VALUES (?, ?, ?)`,
                    [c.category_id, c.category_name, c.node_id],
                    (err) => {
                        if (err) {
                            console.error("CATEGORY INSERT ERROR:", err.message);
                        }
                    }
                );
            });

            console.log("Products received from server:", productsWithLocalImages.length);

productsWithLocalImages.forEach((p) => {
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
      p.node_id ?? null
    ],
    (err) => {
      if (err) {
        console.error("PRODUCT INSERT ERROR:", err.message);
        console.error("PRODUCT DATA:", {
          product_id: p.product_id,
          category_id: p.category_id,
          node_id: p.node_id
        });
      }
    }
  );
});

setTimeout(() => {
  db.get(
    "SELECT COUNT(*) as cnt FROM products",
    [],
    (err, row) => {
      if (err) {
        console.error("COUNT ERROR:", err.message);
      } else {
        console.log("PRODUCT COUNT =", row.cnt);
      }
    }
  );
}, 3000);

            edges.forEach((e) => {
                db.run(
                    `INSERT INTO edges (from_node, to_node, distance)
                     VALUES (?, ?, ?)`,
                    [e.from_node, e.to_node, e.distance],
                    (err) => {
                        if (err) {
                            console.error("EDGE INSERT ERROR:", err.message);
                        }
                    }
                );
            });

            beacons.forEach((b) => {
                db.run(
                    `INSERT INTO beacons (beacon_id, node_id)
                     VALUES (?, ?)`,
                    [b.beacon_id, b.node_id],
                    (err) => {
                        if (err) {
                            console.error("BEACON INSERT ERROR:", err.message);
                        }
                    }
                );
            });

            offers.forEach((o) => {
                db.run(
                    `INSERT INTO offers (product_id, discount)
                     VALUES (?, ?)`,
                    [
                        o.product_id,
                        o.discount_percent ?? o.discount
                    ],
                    (err) => {
                        if (err) {
                            console.error("OFFER INSERT ERROR:", err.message);
                        }
                    }
                );
            });

            crowd.forEach((c) => {
                db.run(
                    `INSERT INTO crowd (node_id, density)
                     VALUES (?, ?)`,
                    [c.node_id, c.crowd_level ?? c.density],
                    (err) => {
                        if (err) {
                            console.error("CROWD INSERT ERROR:", err.message);
                        }
                    }
                );
            });

            db.get(
                "SELECT COUNT(*) as cnt FROM products",
                [],
                (err, row) => {
                    if (err) {
                        console.error("COUNT ERROR:", err.message);
                    } else {
                        console.log(
                            "Products currently in SQLite:",
                            row.cnt
                        );
                    }
                }
            );

            db.run(
                `UPDATE sync_meta
                 SET last_updated_at = datetime('now')
                 WHERE table_name = 'products'`
            );
        });

        return res.json({
            message: "Full sync successful",
            counts: {
                products: products.length,
                categories: categories.length,
                nodes: nodes.length,
                edges: edges.length,
                beacons: beacons.length,
                offers: offers.length,
                crowd: crowd.length
            }
        });

    } catch (err) {
        console.error("FULL SYNC ERROR:", err);
        return res.status(500).json({
            message: "Sync failed",
            error: err.message
        });
    }
};

exports.pushShoppingList = async (req, res) => {
    try {
        const result = await syncService.sendShoppingList();
        res.json(result);
    } catch (err) {
        res.status(500).json({
            message: "Shopping list push failed",
            error: err.response?.data || err.message
        });
    }
};

exports.pushCartItems = async (req, res) => {
    try {
        const result = await syncService.sendCurrentCartItems();
        res.json(result);
    } catch (err) {
        res.status(500).json({
            message: "Current cart push failed",
            error: err.response?.data || err.message
        });
    }
};

exports.pushCheckout = async (req, res) => {
    try {
        const result = await syncService.sendCheckout();
        res.json(result);
    } catch (err) {
        res.status(500).json({
            message: "Cart checkout push failed",
            error: err.response?.data || err.message
        });
    }
};

exports.pushPosition = async (req, res) => {
    try {
        const nodeId = req.body?.node_id || req.body?.nodeId || req.query.node_id || req.query.nodeId;
        const result = await syncService.sendPosition(nodeId);
        res.json(result);
    } catch (err) {
        res.status(500).json({
            message: "Position push failed",
            error: err.response?.data || err.message
        });
    }
};

exports.pushFeedback = async (req, res) => {
    try {
        const result = await syncService.sendFeedback();
        res.json(result);
    } catch (err) {
        res.status(500).json({
            message: "Feedback push failed",
            error: err.response?.data || err.message
        });
    }
};
