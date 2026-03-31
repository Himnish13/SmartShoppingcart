const db = require("../config/sqlite");

exports.syncList = (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid data" });
    }

    db.serialize(() => {
        db.run(`DELETE FROM shopping_list`);

        let done = 0;

        items.forEach(item => {
            db.get(
                `SELECT product_id FROM products 
                 WHERE LOWER(name) LIKE LOWER(?)`,
                [`%${item.name.trim()}%`],
                (err, product) => {

                    if (product) {
                        db.run(
                            `INSERT INTO shopping_list 
                             (product_id, quantity, picked)
                             VALUES (?, ?, 0)`,
                            [product.product_id, item.quantity || 1]
                        );
                    }

                    done++;
                    if (done === items.length) {
                        res.json({ message: "Shopping list synced" });
                    }
                }
            );
        });
    });
};
exports.getList = (req, res) => {
    db.all(
        `SELECT s.product_id, p.name, p.barcode, s.quantity, s.picked
         FROM shopping_list s
         JOIN products p ON s.product_id = p.product_id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};
exports.clearList = (req, res) => {
    db.run(`DELETE FROM shopping_list`, () => {
        res.json({ message: "Shopping list cleared" });
    });
};