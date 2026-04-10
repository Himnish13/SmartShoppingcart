const db = require("../config/db");

const getNodes = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM nodes", (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getEdges = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM edges", (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const getPOI = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.name,
        c.node_id
      FROM product_mastery p
      LEFT JOIN category c 
        ON p.category_id = c.category_id
    `;

    db.query(query, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};
function clearNodes() {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM nodes", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function clearEdges() {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM edges", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function clearCategories() {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM category", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ---------------- INSERT ----------------

function insertNodes(nodes) {
  return Promise.all(nodes.map(n => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO nodes (node_id, x_coordinate, y_coordinate, updated_at) VALUES (?, ?, ?, NOW())",
        [n.node_id, n.x_coordinate, n.y_coordinate],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }));
}

function insertEdges(edges) {
  return Promise.all(edges.map(e => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO edges (from_node, to_node, distance, updated_at) VALUES (?, ?, ?, NOW())",
        [e.from_node, e.to_node, e.distance],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }));
}

function insertCategories(categories) {
  return Promise.all(categories.map(c => {
    return new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO category (category_id, category_name, node_id, updated_at) VALUES (?, ?, ?, NOW())",
        [c.category_id, c.category_name, c.node_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }));
}
function updateNodes(nodes) {
  return Promise.all(nodes.map(n => {
    return new Promise((resolve, reject) => {
      db.query(
        `UPDATE nodes 
         SET x_coordinate = ?, y_coordinate = ?, updated_at = NOW()
         WHERE node_id = ?`,
        [n.x_coordinate, n.y_coordinate, n.node_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }));
}

function updateEdges(edges) {
  return Promise.all(edges.map(e => {
    return new Promise((resolve, reject) => {
      db.query(
        `UPDATE edges 
         SET distance = ?, updated_at = NOW()
         WHERE from_node = ? AND to_node = ?`,
        [e.distance, e.from_node, e.to_node],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }));
}

function updateCategories(categories) {
  return Promise.all(categories.map(c => {
    return new Promise((resolve, reject) => {
      db.query(
        `UPDATE category 
         SET category_name = ?, node_id = ?, updated_at = NOW()
         WHERE category_id = ?`,
        [c.category_name, c.node_id, c.category_id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }));
}
module.exports = {
  getNodes,
  getEdges,
  getPOI,
  clearNodes,
  clearEdges,
  clearCategories,
  insertNodes,
  insertEdges,
  insertCategories,
  updateNodes,
  updateEdges,
  updateCategories
};