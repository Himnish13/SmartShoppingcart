const db = require("../config/sqlite");

exports.fullSync = async (req, res) => {

    try {

        // ✅ MOCK SERVER DATA
        const response = {
            data: {
                last_updated: "2026-03-27T18:00:00Z",
                products: [
                    { product_id: 1, barcode: "111", name: "Milk", category: "Dairy", price: 50, node_id: 2 },
                    { product_id: 2, barcode: "222", name: "Cheese", category: "Dairy", price: 80, node_id: 3 }
                ],
                nodes: [
                    { node_id: 1, x: 0, y: 0 },
                    { node_id: 2, x: 1, y: 1 },
                    { node_id: 3, x: 2, y: 2 }
                ],
                edges: [
                    { from_node: 1, to_node: 2, distance: 1 },
                    { from_node: 2, to_node: 3, distance: 1 }
                ],
                offers: [
                    { offer_id: 1, product_id: 2, node_id: 3, discount: 20 }
                ],
                beacons: []
            }
        };

        const { last_updated, products, nodes, edges, offers, beacons,crowd} = response.data;

        db.get(`SELECT last_sync_time FROM sync_meta`, (err, row) => {

            if (last_updated <= row.last_sync_time) {
                return res.json({ message: "No changes" });
            }

            db.serialize(() => {

                db.run(`DELETE FROM products`);
                db.run(`DELETE FROM nodes`);
                db.run(`DELETE FROM edges`);
                db.run(`DELETE FROM offers`);
                db.run(`DELETE FROM beacons`);
                db.run(`DELETE FROM crowd`);

                products.forEach(p => {
                    db.run(`INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)`,
                        [p.product_id, p.barcode, p.name, p.category, p.price, p.node_id]);
                });

                nodes.forEach(n => {
                    db.run(`INSERT INTO nodes VALUES (?, ?, ?)`,
                        [n.node_id, n.x, n.y]);
                });

                edges.forEach(e => {
                    db.run(`INSERT INTO edges VALUES (?, ?, ?)`,
                        [e.from_node, e.to_node, e.distance]);
                });

                if (crowd) {
                    crowd.forEach(c => {
                        db.run(
                            `INSERT INTO crowd (node_id, density, last_updated)
                            VALUES (?, ?, ?)`,
                            [c.node_id, c.density, c.last_updated]
                        );
                    });
                }

                offers.forEach(o => {
                    db.run(`INSERT INTO offers VALUES (?, ?, ?, ?)`,
                        [o.offer_id, o.product_id, o.node_id, o.discount]);
                });

                db.run(`UPDATE sync_meta SET last_sync_time = ?`, [last_updated]);
            });

            res.json({ message: "Sync done" });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};