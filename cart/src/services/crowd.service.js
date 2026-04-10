const db = require("../config/sqlite");

exports.getCrowdData = (callback) => {

    db.all(`SELECT node_id, density FROM crowd`, [], (err, rows) => {

        if (err) {
            console.error("Crowd fetch error:", err);
            return callback({});
        }

        const crowdData = {};

        rows.forEach(r => {
            const node = Number(r.node_id);
            const density = Number(r.density) || 0;

            if (node) {
                crowdData[node] = density;
            }
        });

        callback(crowdData);
    });
};