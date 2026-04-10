const db = require("../config/sqlite");

function getHeuristic(goalNode, callback) {
    db.all(`SELECT node_id, x, y FROM nodes`, [], (err, nodes) => {
        if (err) return callback(err, null);

        const goal = nodes.find(n => n.node_id === goalNode);
        if (!goal) return callback("Goal node not found", null);

        const heuristic = {};

        nodes.forEach(n => {
            heuristic[n.node_id] = Math.sqrt(
                Math.pow(n.x - goal.x, 2) +
                Math.pow(n.y - goal.y, 2)
            );
        });

        callback(null, heuristic);
    });
}

module.exports = getHeuristic;