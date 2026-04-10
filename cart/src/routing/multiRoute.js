const aStar = require("./astar");

function multiRoute(graph, start, targets, heuristic, crowdData) {

    let current = start;
    let remaining = [...targets];
    let fullPath = [];

    while (remaining.length > 0) {

        let bestTarget = null;
        let bestPath = null;
        let bestCost = Infinity;

        for (let target of remaining) {

            if (!graph[target]) continue;

            // ✅ pass crowdData
            const path = aStar(graph, current, target, heuristic, crowdData);

            if (!path) continue;

            // ✅ cost already includes crowd
            const cost = path.length;

            if (cost < bestCost) {
                bestCost = cost;
                bestTarget = target;
                bestPath = path;
            }
        }

        if (!bestPath) break;

        // avoid duplicate node
        if (fullPath.length > 0) bestPath.shift();

        fullPath = fullPath.concat(bestPath);
        current = bestTarget;

        remaining = remaining.filter(n => n !== bestTarget);
    }

    return fullPath;
}

module.exports = multiRoute;