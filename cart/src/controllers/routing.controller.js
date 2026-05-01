const db = require("../config/sqlite");

const { getGraph } = require("../routing/graph");
const aStar = require("../routing/astar");
const multiRoute = require("../routing/multiRoute");
const { loadStoreLayout } = require("../routing/graphLoader");
const mapService = require("../services/map.services");

const crowdService = require("../services/crowd.service");

// Helper to create heuristic for a target node
function createHeuristic(targetNode, allNodes) {
    const heuristic = {};
    const target = allNodes.find(n => n.node_id === targetNode);
    if (!target) return heuristic;
    
    allNodes.forEach(n => {
        heuristic[n.node_id] = Math.sqrt(
            Math.pow(n.x - target.x, 2) +
            Math.pow(n.y - target.y, 2)
        );
    });
    return heuristic;
}

exports.getRoute = (req, res) => {
   const { startNode, productId, productIds, x, y } = req.body;

    console.log("🚀 Routing Request:", { startNode, productId, productIds, x, y });

    // Load graph and nodes in parallel
    getGraph((graphErr, graph) => {
        if (graphErr) {
            console.error("❌ Graph loading error:", graphErr);
            return res.status(500).json({ message: "Graph loading failed" });
        }

        let currentStartNode = startNode;

        // 🔥 NEW: If BLE coordinates are sent
        if (x !== undefined && y !== undefined) {
            const nearest = mapService.getNearestNode(x, y);

            if (!nearest) {
                console.error("❌ No nearest node found for:", x, y);
                return res.status(400).json({ message: "Invalid position" });
            }

            currentStartNode = nearest.node_id;

            console.log("📍 BLE Position:", x, y);
            console.log("📍 Mapped to Node:", currentStartNode);
        }

        // fallback validation
        if (!graph[currentStartNode]) {
            console.error("❌ Invalid start node:", currentStartNode);
            return res.status(400).json({ message: "Invalid start node" });
        }

        // Load nodes for heuristics
        db.all(`SELECT node_id, x, y FROM nodes`, [], (err, allNodes) => {
            if (err) {
                console.error("❌ Failed to load nodes:", err);
                return res.status(500).json({ message: "Failed to load nodes" });
            }

            crowdService.getCrowdData((crowdData) => {
                console.log("👥 Crowd data retrieved");

                loadStoreLayout((layoutErr, storeLayout) => {
                    if (layoutErr) {
                        console.log("⚠️ Store layout load warning:", layoutErr);
                        storeLayout = { aisles: [], bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 } };
                    }

                    // ✅ HANDLE SELECTED PRODUCTS (Array)
                    if (productIds && Array.isArray(productIds) && productIds.length > 0) {
                        console.log("📦 Processing selected products:", productIds);
                        const placeholders = productIds.map(() => "?").join(",");
                        
                        db.all(
                            `SELECT p.product_id, p.node_id, p.name, p.image_url, c.category_name
                             FROM products p
                             LEFT JOIN category c ON p.category_id = c.category_id
                             WHERE p.product_id IN (${placeholders}) AND p.node_id IS NOT NULL`,
                            productIds,
                            (err, rows) => {
                                if (err) {
                                    console.error("❌ Database error:", err);
                                    return res.status(500).json({ message: "Database error", error: err.message });
                                }

                                console.log("✅ Products found:", rows.length);

                                if (rows.length === 0) {
                                    console.error("❌ No products found for IDs:", productIds);
                                    return res.status(404).json({ message: "No valid products found" });
                                }

                                let targets = rows.map(r => r.node_id).filter(node => graph[node]);
                                
                                console.log("📍 Target nodes:", targets);

                                if (targets.length === 0) {
                                    console.error("❌ No valid nodes found in graph");
                                    return res.status(404).json({ message: "No valid nodes found for selected products" });
                                }

                                try {
                                    const heuristic = createHeuristic(targets[0], allNodes);
                                    const path = multiRoute(
                                        graph,
                                        currentStartNode,
                                        targets,
                                        heuristic,
                                        crowdData
                                    );

                                    console.log("✅ Route generated successfully");

                                    return res.json({
                                        type: "multi",
                                        targets,
                                        selectedProducts: rows,
                                        path,
                                        crowd: crowdData,
                                        storeLayout: storeLayout,
                                        totalItems: rows.length,
                                        completed: 0
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
                        `SELECT p.product_id, p.node_id, p.name, p.image_url, s.quantity, s.picked_quantity,
                                c.category_name
                         FROM shopping_list s
                         JOIN products p ON s.product_id = p.product_id
                         LEFT JOIN category c ON p.category_id = c.category_id
                         WHERE p.node_id IS NOT NULL`,
                        [],
                        (err, rows) => {
                            if (err) {
                                console.error("❌ Database error:", err);
                                return res.status(500).json({ message: "Database error", error: err.message });
                            }

                            console.log("✅ Shopping list items found:", rows.length);

                            let targets = rows.map(r => r.node_id).filter(node => graph[node]);
                            let totalItems = rows.length;
                            let completedItems = rows.filter(r => r.picked_quantity >= r.quantity).length;

                            if (targets.length > 0) {
                                try {
                                    const heuristic = createHeuristic(targets[0], allNodes);
                                    const path = multiRoute(
                                        graph,
                                        currentStartNode,
                                        targets,
                                        heuristic,
                                        crowdData
                                    );

                                    return res.json({
                                        type: "multi",
                                        targets,
                                        items: rows,
                                        path,
                                        crowd: crowdData,
                                        storeLayout: storeLayout,
                                        totalItems,
                                        completed: completedItems
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
                                            const heuristic = createHeuristic(product.node_id, allNodes);
                                            const path = aStar(
                                                graph,
                                                currentStartNode,
                                                product.node_id,
                                                heuristic,
                                                crowdData
                                            );

                                            return res.json({
                                                type: "single",
                                                path,
                                                crowd: crowdData,
                                                storeLayout: storeLayout,
                                                totalItems: 1,
                                                completed: 0
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
                                message: "No shopping list or product selected",
                                storeLayout: storeLayout,
                                totalItems: 0,
                                completed: 0
                            });
                        }
                    );
                });
            });
        });
    });
};

// ✅ GET ALL NODES WITH COORDINATES
exports.getNodes = (req, res) => {
    db.all(
        `SELECT n.node_id as id, n.x, n.y, c.category_name as aisle, c.category_id as aisleId
         FROM nodes n
         LEFT JOIN category c ON n.node_id = c.node_id
         ORDER BY n.node_id`,
        [],
        (err, nodes) => {
            if (err) {
                console.error("❌ Database error:", err);
                return res.status(500).json({ message: "Database error", error: err.message });
            }

            const nodeMap = {};
            nodes.forEach(node => {
                nodeMap[node.id] = {
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    aisle: node.aisle,
                    aisleId: node.aisleId
                };
            });

            return res.json(nodeMap);
        }
    );
};

// ✅ GET STORE LAYOUT WITH AISLES
exports.getStoreLayout = (req, res) => {
    loadStoreLayout((err, storeLayout) => {
        if (err) {
            console.error("❌ Failed to load store layout:", err);
            return res.status(500).json({ message: "Failed to load store layout", error: err.message });
        }

        return res.json(storeLayout);
    });
};