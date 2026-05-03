const db = require("../config/db");

exports.getCrowd = () => {
  return new Promise((res, rej) => {
    db.query("SELECT * FROM crowd_data", (e, r) =>
      e ? rej(e) : res(r)
    );
  });
};

exports.setCrowdLevel = (nodeId, crowdLevel) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM crowd_data WHERE node_id = ?",
      [nodeId],
      (err, results) => {
        if (err) return reject(err);

        if (results && results.length > 0) {
          db.query(
            "UPDATE crowd_data SET crowd_level = ?, updated_at = NOW() WHERE node_id = ?",
            [crowdLevel, nodeId],
            (updateErr) => {
              if (updateErr) return reject(updateErr);
              resolve({
                message: "Crowd data updated",
                node_id: nodeId,
                crowd_level: crowdLevel,
                action: "updated"
              });
            }
          );
        } else {
          db.query(
            "INSERT INTO crowd_data (node_id, crowd_level, updated_at) VALUES (?, ?, NOW())",
            [nodeId, crowdLevel],
            (insertErr) => {
              if (insertErr) return reject(insertErr);
              resolve({
                message: "Crowd data created",
                node_id: nodeId,
                crowd_level: crowdLevel,
                action: "created"
              });
            }
          );
        }
      }
    );
  });
};

exports.incrementCrowd = (nodeId) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM crowd_data WHERE node_id = ?",
      [nodeId],
      (err, results) => {
        if (err) return reject(err);

        if (results && results.length > 0) {
          db.query(
            "UPDATE crowd_data SET crowd_level = crowd_level + 1, updated_at = NOW() WHERE node_id = ?",
            [nodeId],
            (updateErr) => {
              if (updateErr) return reject(updateErr);
              resolve({
                message: "Crowd data incremented",
                node_id: nodeId,
                action: "updated"
              });
            }
          );
        } else {
          db.query(
            "INSERT INTO crowd_data (node_id, crowd_level, updated_at) VALUES (?, 1, NOW())",
            [nodeId],
            (insertErr) => {
              if (insertErr) return reject(insertErr);
              resolve({
                message: "Crowd data created",
                node_id: nodeId,
                action: "created"
              });
            }
          );
        }
      }
    );
  });
};
