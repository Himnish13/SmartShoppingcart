function aStar(graph, start, goal, heuristic, crowdData) {

    const openSet = new Set([start]);
    const cameFrom = {};

    const gScore = {};
    const fScore = {};

    Object.keys(graph).forEach(n => {
        gScore[n] = Infinity;
        fScore[n] = Infinity;
    });

    gScore[start] = 0;
    fScore[start] = heuristic[start];

    const crowdWeight = 2;

    while (openSet.size > 0) {

        let current = [...openSet].reduce((a, b) =>
            fScore[a] < fScore[b] ? a : b
        );

        if (current == goal) {
            const path = [];
            while (current) {
                path.unshift(current);
                current = cameFrom[current];
            }
            return path;
        }

        openSet.delete(current);

        for (let neighbor in graph[current]) {

            const baseCost = graph[current][neighbor];
            const crowd = crowdData[neighbor] || 0;

            const totalCost = baseCost + (crowd * crowdWeight);

            const tempG = gScore[current] + totalCost;

            if (tempG < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tempG;
                fScore[neighbor] = tempG + heuristic[neighbor];

                openSet.add(neighbor);
            }
        }
    }

    return null;
}

module.exports = aStar;