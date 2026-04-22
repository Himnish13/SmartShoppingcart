const { loadGraph } = require("./graphLoader");

let cachedGraph = null;
let graphLoadPromise = null;

function getGraph(callback) {
    if (cachedGraph) {
        return callback(null, cachedGraph);
    }

    if (graphLoadPromise) {
        graphLoadPromise.then(
            (graph) => callback(null, graph),
            (err) => callback(err, null)
        );
        return;
    }

    graphLoadPromise = new Promise((resolve, reject) => {
        loadGraph((err, graph) => {
            if (err) {
                reject(err);
                return callback(err, null);
            }
            cachedGraph = graph;
            resolve(graph);
            callback(null, graph);
        });
    });
}

function invalidateCache() {
    cachedGraph = null;
    graphLoadPromise = null;
}

module.exports = { getGraph, invalidateCache };