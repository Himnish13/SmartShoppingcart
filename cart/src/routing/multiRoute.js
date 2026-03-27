const aStar = require("./astar");

function multiRoute(graph, start, targets, heuristic) {
    let current = start;
    let remaining = [...targets];
    let fullPath = [];

    while (remaining.length > 0) {
        let bestTarget = null;
        let bestPath = null;
        let bestCost = Infinity;

        for (let target of remaining) {
            if (!graph[target]) continue;

            const path = aStar(graph, current, target, heuristic);

            if (!path) continue;

            if (path.length < bestCost) {
                bestCost = path.length;
                bestTarget = target;
                bestPath = path;
            }
        }

        if (!bestPath) break;

        if (fullPath.length > 0) bestPath.shift();

        fullPath = fullPath.concat(bestPath);
        current = bestTarget;

        remaining = remaining.filter(n => n !== bestTarget);
    }

    return fullPath;
}

module.exports = multiRoute;