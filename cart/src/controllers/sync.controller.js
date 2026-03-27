const db = require("../config/sqlite");
const axios = require("axios");

exports.fullSync = async (req, res) => {
    try {
        const response = await axios.get("http://MAIN_SERVER_URL/full-sync");

        const { products, nodes, edges, category, beacons } = response.data;

        db.serialize(() => {

            // clear old data
            db.run(`DELETE FROM products`);
            db.run(`DELETE FROM nodes`);
            db.run(`DELETE FROM edges`);
            db.run(`DELETE FROM category`);
            db.run(`DELETE FROM beacons`);

            // insert products
            products.forEach(p => {
                db.run(
                    `INSERT INTO products 
                     (product_id, barcode, name, category, price, node_id)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [p.product_id, p.barcode, p.name, p.category, p.price, p.node_id]
                );
            });

            // insert nodes
            nodes.forEach(n => {
                db.run(
                    `INSERT INTO nodes (node_id, x, y)
                     VALUES (?, ?, ?)`,
                    [n.node_id, n.x, n.y]
                );
            });

            // insert edges
            edges.forEach(e => {
                db.run(
                    `INSERT INTO edges (from_node, to_node, distance)
                     VALUES (?, ?, ?)`,
                    [e.from_node, e.to_node, e.distance]
                );
            });

            // insert category
            if (category) {
                category.forEach(c => {
                    db.run(
                        `INSERT INTO category (category_id, name)
                         VALUES (?, ?)`,
                        [c.category_id, c.name]
                    );
                });
            }

            // insert beacons
            if (beacons) {
                beacons.forEach(b => {
                    db.run(
                        `INSERT INTO beacons (beacon_id, node_id)
                         VALUES (?, ?)`,
                        [b.beacon_id, b.node_id]
                    );
                });
            }

            // update sync meta
            db.run(
                `DELETE FROM sync_meta`
            );

            db.run(
                `INSERT INTO sync_meta (last_sync_time) VALUES (?)`,
                [new Date().toISOString()]
            );
        });

        res.json({ message: "Full sync completed successfully" });

    } catch (err) {
        res.status(500).json({
            message: "Full sync failed",
            error: err.message
        });
    }
};