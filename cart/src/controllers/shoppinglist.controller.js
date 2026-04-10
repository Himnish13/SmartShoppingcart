const db = require("../config/sqlite");

exports.syncList = (req, res) => {
    const { user_id, items } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid data" });
    }

    db.serialize(() => {

        if (user_id) {
            db.run(
                `UPDATE user_session SET user_id = ? WHERE session_id = ?`,
                [user_id, "session1"]
            );
        }

        db.run(`DELETE FROM shopping_list`);

        let done = 0;

        items.forEach(item => {
            db.get(
                `SELECT product_id 
                 FROM products 
                 WHERE LOWER(name) LIKE LOWER(?) 
                 LIMIT 1`,
                [`%${item.name.trim()}%`],
                (err, product) => {

                    if (err) return res.status(500).json(err);

                    if (product) {
                        db.run(
                            `INSERT INTO shopping_list (product_id, quantity, picked, picked_quantity)
                             VALUES (?, ?, 0, 0)`,
                            [product.product_id, item.quantity || 1]
                        );
                    }

                    done++;
                    if (done === items.length) {
                        res.json({ message: "User + Shopping list synced" });
                    }
                }
            );
        });
    });
};

exports.getList = (req, res) => {
    db.all(
        `SELECT 
            s.product_id, 
            p.name, 
            p.barcode, 
            s.quantity, 
            s.picked,
            c.category_name
         FROM shopping_list s
         JOIN products p ON s.product_id = p.product_id
         LEFT JOIN category c ON p.category_id = c.category_id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

exports.clearList = (req, res) => {
    db.run(`DELETE FROM shopping_list`, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Shopping list cleared" });
    });
};