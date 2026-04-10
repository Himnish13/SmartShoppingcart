const db = require("../config/sqlite");
const positionService = require("./sync.service");

let currentNode = null;

function updatePosition(node) {

    if (node === currentNode) return;

    currentNode = node;

    console.log("📍 Node changed:", node);

  
    db.run(
        `UPDATE cart_position 
         SET node_id = ?, updated_at = datetime('now') 
         WHERE id = 1`,
        [node]
    );

    
    positionService.sendPosition(node);
}


function startAutoSync() {

    setInterval(() => {

        db.get(
            `SELECT node_id FROM cart_position WHERE id = 1`,
            (err, row) => {

                if (!row || row.node_id == null) return;

                positionService.sendPosition(row.node_id);
            }
        );

    }, 5000); 
}

module.exports = { updatePosition, startAutoSync };