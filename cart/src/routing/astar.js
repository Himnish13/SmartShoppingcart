function aStar(graph, start, goal, heuristic) {
    const openSet = new Set([start]);
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    Object.keys(graph).forEach(node => {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    });

    gScore[start] = 0;
    fScore[start] = heuristic[start];

    while (openSet.size > 0) {
        let current = [...openSet].reduce((a, b) =>
            fScore[a] < fScore[b] ? a : b
        );

        if (current == goal) {
            const path = [];
            while (current) {
                path.unshift(Number(current));
                current = cameFrom[current];
            }
            return path;
        }

        openSet.delete(current);

        for (let neighbor in graph[current]) {
            const tentative = gScore[current] + graph[current][neighbor];

            if (tentative < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentative;
                fScore[neighbor] = tentative + heuristic[neighbor];
                openSet.add(neighbor);
            }
        }
    }

    return null;
}

module.exports = aStar;