

const db = require("../config/sqlite");

const graph = require("../routing/graph");
const heuristic = require("../routing/heuristic");
const aStar = require("../routing/astar");
const multiRoute = require("../routing/multiRoute");

const crowdService = require("../services/crowd.service");

exports.getRoute = (req, res) => {
    const { startNode, productId, productIds } = req.body;

    console.log("🚀 Routing Request:", { startNode, productId, productIds });

    if (!graph[startNode]) {
        console.error("❌ Invalid start node:", startNode);
        return res.status(400).json({ message: "Invalid start node" });
    }

    crowdService.getCrowdData((crowdData) => {
        console.log("👥 Crowd data retrieved:", crowdData);

        // ✅ HANDLE SELECTED PRODUCTS (Array)
        if (productIds && Array.isArray(productIds) && productIds.length > 0) {
            console.log("📦 Processing selected products:", productIds);
            const placeholders = productIds.map(() => "?").join(",");
            
            db.all(
                `SELECT p.product_id, p.node_id 
                 FROM products p
                 WHERE p.product_id IN (${placeholders}) AND p.node_id IS NOT NULL`,
                productIds,
                (err, rows) => {
                    if (err) {
                        console.error("❌ Database error:", err);
                        return res.status(500).json({ message: "Database error", error: err.message });
                    }

                    console.log("✅ Products found:", rows);

                    if (rows.length === 0) {
                        console.error("❌ No products found for IDs:", productIds);
                        return res.status(404).json({ message: "No valid products found" });
                    }

                    let targets = rows.map(r => r.node_id).filter(node => graph[node]);
                    
                    console.log("📍 Target nodes:", targets);
                    console.log("📊 Graph keys:", Object.keys(graph).slice(0, 10));

                    if (targets.length === 0) {
                        console.error("❌ No valid nodes found in graph");
                        return res.status(404).json({ message: "No valid nodes found for selected products" });
                    }

                    try {
                        const path = multiRoute(
                            graph,
                            startNode,
                            targets,
                            heuristic,
                            crowdData
                        );

                        console.log("✅ Route generated successfully, path length:", path.length);

                        return res.json({
                            type: "multi",
                            targets,
                            selectedProducts: rows,
                            path,
                            crowd: crowdData
                        });
                    } catch (routeErr) {
                        console.error("❌ Route generation error:", routeErr);
                        return res.status(500).json({ message: "Route generation failed", error: routeErr.message });
                    }
                }
            );
            return;
        }

        // ✅ HANDLE ALL SHOPPING LIST ITEMS (Default)
        db.all(
            `SELECT p.product_id, p.node_id 
             FROM shopping_list s
             JOIN products p ON s.product_id = p.product_id
             WHERE p.node_id IS NOT NULL`,
            [],
            (err, rows) => {
                if (err) {
                    console.error("❌ Database error:", err);
                    return res.status(500).json({ message: "Database error", error: err.message });
                }

                console.log("✅ Shopping list items found:", rows);

                let targets = rows.map(r => r.node_id).filter(node => graph[node]);

                if (targets.length > 0) {
                    try {
                        const path = multiRoute(
                            graph,
                            startNode,
                            targets,
                            heuristic,
                            crowdData
                        );

                        return res.json({
                            type: "multi",
                            targets,
                            path,
                            crowd: crowdData
                        });
                    } catch (routeErr) {
                        console.error("❌ Route generation error:", routeErr);
                        return res.status(500).json({ message: "Route generation failed", error: routeErr.message });
                    }
                }

                // ✅ HANDLE SINGLE PRODUCT
                if (productId) {
                    db.get(
                        `SELECT node_id FROM products WHERE product_id = ?`,
                        [productId],
                        (err, product) => {
                            if (err) {
                                console.error("❌ Database error:", err);
                                return res.status(500).json({ message: "Database error", error: err.message });
                            }

                            if (!product || !product.node_id || !graph[product.node_id]) {
                                console.error("❌ Invalid product node");
                                return res.status(404).json({ message: "Invalid product node" });
                            }

                            try {
                                const path = aStar(
                                    graph,
                                    startNode,
                                    product.node_id,
                                    heuristic,
                                    crowdData
                                );

                                return res.json({
                                    type: "single",
                                    path,
                                    crowd: crowdData
                                });
                            } catch (routeErr) {
                                console.error("❌ Route generation error:", routeErr);
                                return res.status(500).json({ message: "Route generation failed", error: routeErr.message });
                            }
                        }
                    );
                    return;
                }

                console.warn("⚠️ No products or shopping list items found");
                return res.json({
                    type: "none",
                    path: [],
                    message: "No shopping list or product selected"
                });
            }
        );
    });
};