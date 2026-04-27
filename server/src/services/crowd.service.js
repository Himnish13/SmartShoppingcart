const db = require("../config/db");

exports.getCrowd = () => {
  return new Promise((res, rej) => {
    db.query("SELECT * FROM crowd_data", (e, r) =>
      e ? rej(e) : res(r)
    );
  });
};

// 🔹 Increment crowd data for a specific node
exports.incrementCrowd = (nodeId) => {
  return new Promise((resolve, reject) => {
    // Check if node already has crowd data
    db.query(
      "SELECT * FROM crowd_data WHERE node_id = ?",
      [nodeId],
      (err, results) => {
        if (err) return reject(err);

        if (results && results.length > 0) {
          // Update existing entry - increment crowd_level
          db.query(
            "UPDATE crowd_data SET crowd_level = crowd_level + 1, updated_at = NOW() WHERE node_id = ?",
            [nodeId],
            (err, result) => {
              if (err) return reject(err);
              resolve({
                message: "Crowd data incremented",
                node_id: nodeId,
                action: "updated"
              });
            }
          );
        } else {
          // Insert new entry with crowd_level 1
          db.query(
            "INSERT INTO crowd_data (node_id, crowd_level, updated_at) VALUES (?, 1, NOW())",
            [nodeId],
            (err, result) => {
              if (err) return reject(err);
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