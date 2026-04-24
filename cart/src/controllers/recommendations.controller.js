const db = require("../config/sqlite");
const aStar = require("../routing/astar");
const graph = require("../routing/graph");
const heuristic = require("../routing/heuristic");

// Promisified DB helpers
const dbAll = (query, params = []) =>
    new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

exports.getNearbyRecommendations = async (req, res) => {
    try {
        const { currentNode } = req.body;

        if (currentNode === undefined) {
            return res.status(400).json({ error: "currentNode is required" });
        }

        const MAX_DISTANCE = 3;

        // ✅ Single optimized query (no extra DB calls inside loop)
        const offers = await dbAll(`
            SELECT 
                o.product_id,
                o.discount,
                p.name,
                p.price,
                p.image_url,
                p.node_id,
                c.category_name
            FROM offers o
            JOIN products p ON o.product_id = p.product_id
            JOIN category c ON p.category_id = c.category_id
        `);

        // ✅ Process offers (no nested DB calls now)
        const recommendations = offers
            .map((o) => {
                if (!o.node_id) return null;

                const path = aStar(graph, currentNode, o.node_id, heuristic);
                if (!path) return null;

                const distance = path.length;

                if (distance > MAX_DISTANCE) return null;

                return {
                    product_id: o.product_id,
                    name: o.name,
                    price: o.price,
                    image_url: o.image_url,
                    discount: o.discount,
                    node_id: o.node_id,
                    distance
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance);

        res.json({ recommendations });

    } catch (error) {
        console.error("Recommendation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};