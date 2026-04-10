const axios = require("axios");
const db = require("../config/sqlite");

const SERVER_URL = "http://MAIN_SERVER_URL";


exports.fullSync = async (req, res) => {

    try {
        
        const response = await axios.get(`${SERVER_URL}/sync/full`);

        const {
            products = [],
            nodes = [],
            edges = [],
            beacons = [],
            offers = [],
            crowd = []
        } = response.data;

        db.serialize(() => {

            
            db.run(`DELETE FROM products`);
            db.run(`DELETE FROM nodes`);
            db.run(`DELETE FROM edges`);
            db.run(`DELETE FROM beacons`);
            db.run(`DELETE FROM offers`);
            db.run(`DELETE FROM crowd`);

          
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

            
            offers.forEach(o => {
                db.run(
                    `INSERT INTO offers (offer_id, product_id, node_id, discount)
                     VALUES (?, ?, ?, ?)`,
                    [o.offer_id, o.product_id, o.node_id, o.discount]
                );
            });

            
            crowd.forEach(c => {
                db.run(
                    `INSERT INTO crowd (node_id, density)
                     VALUES (?, ?)`,
                    [c.node_id, c.density]
                );
            });

            
            db.run(
                `UPDATE sync_meta 
                 SET last_sync_time = datetime('now')`
            );
        });

        return res.json({
            message: "Full sync successful",
            counts: {
                products: products.length,
                nodes: nodes.length,
                edges: edges.length,
                beacons: beacons.length,
                offers: offers.length,
                crowd: crowd.length
            }
        });

    } catch (err) {

        console.log();
    }
}