const db = require("../config/sqlite");

exports.fullSync = async (req, res) => {
    try {

        // ✅ MOCK SERVER RESPONSE (replace later)
        const response = {
            data: {
                last_updated: "2026-03-27T18:00:00Z",
                products: [
                    { product_id: 1, barcode: "111", name: "Milk", category: "Dairy", price: 50, node_id: 2 }
                ],
                nodes: [
                    { node_id: 1, x: 0, y: 0 },
                    { node_id: 2, x: 1, y: 1 }
                ],
                edges: [
                    { from_node: 1, to_node: 2, distance: 1 }
                ],
                beacons: []
            }
        };

        const { last_updated, products, nodes, edges, beacons } = response.data;

        // ✅ Check last sync time
        db.get(`SELECT last_sync_time FROM sync_meta`, (err, row) => {

            const lastSync = row.last_sync_time;

            // 🧠 compare timestamps
            if (last_updated <= lastSync) {
                return res.json({
                    message: "No changes, sync skipped"
                });
            }

            console.log("Changes detected → syncing...");

            db.serialize(() => {

                db.run(`DELETE FROM products`);
                db.run(`DELETE FROM nodes`);
                db.run(`DELETE FROM edges`);
                db.run(`DELETE FROM beacons`);

                products.forEach(p => {
                    db.run(
                        `INSERT INTO products 
                         (product_id, barcode, name, category, price, node_id)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [p.product_id, p.barcode, p.name, p.category, p.price, p.node_id]
                    );
                });

                nodes.forEach(n => {
                    db.run(
                        `INSERT INTO nodes (node_id, x, y)
                         VALUES (?, ?, ?)`,
                        [n.node_id, n.x, n.y]
                    );
                });

                edges.forEach(e => {
                    db.run(
                        `INSERT INTO edges (from_node, to_node, distance)
                         VALUES (?, ?, ?)`,
                        [e.from_node, e.to_node, e.distance]
                    );
                });

                beacons.forEach(b => {
                    db.run(
                        `INSERT INTO beacons (beacon_id, node_id)
                         VALUES (?, ?)`,
                        [b.beacon_id, b.node_id]
                    );
                });

                // ✅ update sync time
                db.run(
                    `UPDATE sync_meta SET last_sync_time = ?`,
                    [last_updated]
                );
            });

            res.json({
                message: "Sync completed",
                synced_at: last_updated
            });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};