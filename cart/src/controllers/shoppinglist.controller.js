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

exports.addToList = (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ message: "Invalid data" });
    }

    db.run(
        `INSERT INTO shopping_list (product_id, quantity, picked, picked_quantity)
         VALUES (?, ?, 0, 0)`,
        [product_id, quantity],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ message: "Item added to shopping list", id: this.lastID });
        }
    );
};

exports.updateQuantity = (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ message: "Invalid data" });
    }

    db.run(
        `UPDATE shopping_list 
         SET quantity = ? 
         WHERE product_id = ?`,
        [quantity, product_id],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ message: "Quantity updated" });
        }
    );
};
exports.removeFromList = (req, res) => {
    const { product_id } = req.body;

    if (!product_id) {
        return res.status(400).json({ message: "Invalid data" });
    }

    db.run(
        `DELETE FROM shopping_list 
         WHERE product_id = ?`,
        [product_id],
        function (err) {
            if (err) return res.status(500).json(err);
            res.json({ message: "Item removed from shopping list" });
        }
    );
};
exports.getList = (req, res) => {
    db.all(
        `SELECT 
            s.product_id, 
            p.name, 
            p.barcode, 
            p.image_url,
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
exports.getByCategory = (req, res) => {
    const { category_id } = req.params;

    db.all(
        `SELECT 
            s.product_id, 
            p.name, 
            p.barcode, 
            p.image_url,
            s.quantity, 
            s.picked,
            c.category_name
         FROM shopping_list s
         JOIN products p ON s.product_id = p.product_id
         JOIN category c ON p.category_id = c.category_id
         WHERE c.category_id = ?`,
        [category_id],
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