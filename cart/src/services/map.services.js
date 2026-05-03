const db = require("../config/sqlite");

let cachedNodes = [];
function loadNodes() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT node_id, x, y FROM nodes`, [], (err, rows) => {
      if (err) reject(err);
      else {
        cachedNodes = rows;
        console.log("✅ Nodes loaded:", rows.length);
        resolve();
      }
    });
  });
}

function getNearestNode(x, y) {
  let minDist = Infinity;
  let nearest = null;

  for (let node of cachedNodes) {
    const dx = node.x - x;
    const dy = node.y - y;

    const dist = dx * dx + dy * dy;

    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }

  return nearest;
}

module.exports = {
  loadNodes,
  getNearestNode
};