const db = require("../config/sqlite");

const graph = require("../routing/graph");        // ✅ ADD THIS
const heuristic = require("../routing/heuristic");
const aStar = require("../routing/astar");
const multiRoute = require("../routing/multiRoute");

// const loadGraph = require("../routing/graphLoader");
// const getHeuristic = require("../routing/heuristic");

// loadGraph((err, graph) => {
//     getHeuristic(goalNode, (err, heuristic) => {
//         const path = aStar(graph, startNode, goalNode, heuristic);
//     });
// });
exports.getRoute = (req, res) => {
    const { startNode, productId } = req.body;

    if (!graph[startNode]) {
        return res.status(400).json({ message: "Invalid start node" });
    }

    db.all(
        `SELECT p.node_id 
         FROM shopping_list s
         JOIN products p ON s.product_id = p.product_id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);

            console.log("DB rows:", rows);

            let targets = rows.map(r => r.node_id);
            targets = targets.filter(node => graph[node]);

            console.log("Targets:", targets);

            // ✅ MULTI ROUTE
            if (targets.length > 0) {
                const path = multiRoute(graph, startNode, targets, heuristic);

                return res.json({
                    type: "multi",
                    targets,
                    path
                });
            }

            // ✅ SINGLE ROUTE
            if (productId) {
                db.get(
                    `SELECT node_id FROM products WHERE product_id = ?`,
                    [productId],
                    (err, product) => {
                        if (!product || !graph[product.node_id]) {
                            return res.status(404).json({ message: "Invalid product node" });
                        }

                        const path = aStar(graph, startNode, product.node_id, heuristic);

                        return res.json({
                            type: "single",
                            path
                        });
                    }
                );
                return;
            }
            return res.json({
                type: "none",
                path: [],
                message: "No shopping list or product selected"
            });
        }
    );
};