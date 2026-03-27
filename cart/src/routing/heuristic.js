const heuristic = {
    1: 5,
    2: 4,
    3: 3,
    4: 2,
    5: 1,
    6: 0
};

module.exports = heuristic;



// const db = require("../config/sqlite");

// function getHeuristic(goalNode, callback) {
//     db.all(`SELECT * FROM nodes`, [], (err, nodes) => {
//         if (err) return callback(err, null);

//         const goal = nodes.find(n => n.node_id === goalNode);
//         if (!goal) return callback("Goal node not found", null);

//         const heuristic = {};

//         nodes.forEach(n => {
//             heuristic[n.node_id] = Math.sqrt(
//                 Math.pow(n.x - goal.x, 2) +
//                 Math.pow(n.y - goal.y, 2)
//             );
//         });

//         callback(null, heuristic);
//     });
// }

// module.exports = getHeuristic;