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

module.exports = loadGraph;