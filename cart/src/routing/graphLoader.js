const db = require("../config/sqlite");

function loadGraph(callback) {
    db.all(`SELECT * FROM edges`, [], (err, rows) => {
        if (err) return callback(err, null);

        const graph = {};

        rows.forEach(edge => {
            const { from_node, to_node, distance } = edge;

            if (!graph[from_node]) graph[from_node] = {};
            if (!graph[to_node]) graph[to_node] = {};

            graph[from_node][to_node] = distance;
            graph[to_node][from_node] = distance; // undirected
        });

        callback(null, graph);
    });
}

function loadGraphWithCoordinates(callback) {
    db.all(
        `SELECT n.node_id, n.x, n.y, c.category_name, c.category_id
         FROM nodes n
         LEFT JOIN category c ON n.node_id = c.node_id
         ORDER BY n.node_id`,
        [],
        (err, nodes) => {
            if (err) return callback(err, null);

            db.all(`SELECT * FROM edges`, [], (err, edges) => {
                if (err) return callback(err, null);

                const graph = {};
                const nodeMap = {};

                nodes.forEach(node => {
                    nodeMap[node.node_id] = {
                        id: node.node_id,
                        x: node.x,
                        y: node.y,
                        aisle: node.category_name || null,
                        aisleId: node.category_id || null
                    };

                    if (!graph[node.node_id]) graph[node.node_id] = {};
                });

                edges.forEach(edge => {
                    const { from_node, to_node, distance } = edge;
                    graph[from_node][to_node] = distance;
                    graph[to_node][from_node] = distance;
                });

                callback(null, { graph, nodes: nodeMap });
            });
        }
    );
}

function loadStoreLayout(callback) {
    db.all(
        `SELECT DISTINCT 
            c.category_id, 
            c.category_name as aisle_name,
            c.node_id,
            n.x, 
            n.y,
            COUNT(p.product_id) as product_count
         FROM category c
         LEFT JOIN nodes n ON c.node_id = n.node_id
         LEFT JOIN products p ON c.category_id = p.category_id
         GROUP BY c.category_id
         ORDER BY c.category_id`,
        [],
        (err, aisles) => {
            if (err) return callback(err, null);

            const storeLayout = {
                aisles: aisles,
                bounds: {
                    minX: 0,
                    minY: 0,
                    maxX: 10,
                    maxY: 10
                }
            };

            db.all(`SELECT node_id, x, y FROM nodes`, [], (err, nodes) => {
                if (err) return callback(err, null);

                if (nodes.length > 0) {
                    const xs = nodes.map(n => n.x);
                    const ys = nodes.map(n => n.y);
                    storeLayout.bounds = {
                        minX: Math.min(...xs),
                        minY: Math.min(...ys),
                        maxX: Math.max(...xs),
                        maxY: Math.max(...ys)
                    };
                }

                callback(null, storeLayout);
            });
        }
    );
}

module.exports = { loadGraph, loadGraphWithCoordinates, loadStoreLayout };