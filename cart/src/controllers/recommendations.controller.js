const db = require("../config/sqlite");
const aStar = require("../routing/astar");
const graph = require("../routing/graph");
const heuristic = require("../routing/heuristic");

exports.getNearbyRecommendations = (req, res) => {

    const { currentNode } = req.body;
    const MAX_DISTANCE = 3;

    db.all(`SELECT * FROM offers`, [], (err, offers) => {

        db.all(
            `SELECT c.category_name 
             FROM shopping_list s
             JOIN products p ON s.product_id = p.product_id
             JOIN category c ON p.category_id = c.category_id`,
            [],
            (err, shopping) => {

                const categories = shopping.map(s => s.category_name);

                const result = [];

                offers.forEach(o => {

                    const path = aStar(graph, currentNode, o.node_id, heuristic);
                    if (!path) return;

                    const distance = path.length;

                    if (distance <= MAX_DISTANCE) {

                        db.get(
                            `SELECT p.name, c.category_name 
                             FROM products p
                             JOIN category c ON p.category_id = c.category_id
                             WHERE p.product_id = ?`,
                            [o.product_id],
                            (err, product) => {

                                if (!product) return;

                                if (categories.includes(product.category_name)) {

                                    result.push({
                                        product_id: o.product_id,
                                        name: product.name,
                                        discount: o.discount,
                                        distance
                                    });
                                }
                            }
                        );
                    }
                });

                setTimeout(() => {
                    result.sort((a, b) => a.distance - b.distance);
                    res.json({ recommendations: result });
                }, 200);
            }
        );
    });
};