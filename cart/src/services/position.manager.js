const db = require("../config/sqlite");
const positionService = require("./sync.service");

let currentNode = null;

function updatePosition(node) {

    if (node === currentNode) return;

    currentNode = node;

    console.log("📍 Node changed:", node);

    // ✅ Update DB
    db.run(
        `UPDATE cart_position 
         SET node_id = ?, updated_at = datetime('now') 
         WHERE id = 1`,
        [node]
    );

    // ✅ Send immediately
    positionService.sendPosition(node);
}

// 🔥 resend periodically (reliability)
function startAutoSync() {

    setInterval(() => {

        db.get(
            `SELECT node_id FROM cart_position WHERE id = 1`,
            (err, row) => {

                if (!row || row.node_id == null) return;

                positionService.sendPosition(row.node_id);
            }
        );

    }, 5000); // every 5 sec
}

module.exports = { updatePosition, startAutoSync };