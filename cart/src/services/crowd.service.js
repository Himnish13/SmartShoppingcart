const db = require("../config/sqlite");

exports.getCrowdData = (callback) => {

    db.all(`SELECT * FROM crowd`, [], (err, rows) => {

        const crowdData = {};

        rows.forEach(r => {
            crowdData[r.node_id] = r.density;
        });

        callback(crowdData);
    });
};