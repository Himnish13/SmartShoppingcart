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
                        db.get(
                            `SELECT stock FROM products WHERE product_id = ?`,
                            [product.product_id],
                            (err2, stockRow) => {
                                if (!err2 && stockRow && stockRow.stock > 0) {
                                    db.run(
                                        `INSERT INTO shopping_list (product_id, quantity, picked, picked_quantity)
                                         VALUES (?, ?, 0, 0)`,
                                        [product.product_id, item.quantity || 1]
                                    );
                                }
                            }
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

    // ✅ Step 1: Check stock first
    db.get(
        `SELECT stock, name FROM products WHERE product_id = ?`,
        [product_id],
        (err, product) => {
            if (err) return res.status(500).json(err);

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            
            if (product.stock <= 0) {
                return res.json({
                    status: "out_of_stock",
                    product_name: product.name,
                    product_id: product_id
                });
            }

            if (quantity > product.stock) {
                return res.json({
                    status: "insufficient_stock",
                    available_stock: product.stock,
                    product_name: product.name
                });
            }
            db.run(
                `INSERT INTO shopping_list (product_id, quantity, picked, picked_quantity)
                 VALUES (?, ?, 0, 0)`,
                [product_id, quantity],
                function (err) {
                    if (err) return res.status(500).json(err);

                    res.json({
                        status: "added",
                        message: "Item added to shopping list",
                        id: this.lastID
                    });
                }
            );
        }
    );
};

exports.updateQuantity = (req, res) => {
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).json({ message: "Invalid data" });
    }

    db.get(
        `SELECT stock, name FROM products WHERE product_id = ?`,
        [product_id],
        (err, product) => {
            if (err) return res.status(500).json(err);
            if (!product) return res.status(404).json({ message: "Product not found" });

            if (quantity > product.stock) {
                return res.json({
                    status: "insufficient_stock",
                    available_stock: product.stock,
                    product_name: product.name
                });
            }

            db.run(
                `UPDATE shopping_list 
                 SET quantity = ? 
                 WHERE product_id = ?`,
                [quantity, product_id],
                function (err) {
                    if (err) return res.status(500).json(err);
                    res.json({ status: "success", message: "Quantity updated" });
                }
            );
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
            p.node_id,
            s.quantity, 
            s.picked,
            c.category_name,
            c.category_name AS aisle
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

function parsePasteText(text) {
    if (!text) return [];
    const lines = text.split(/\r?\n/);
    const items = [];

    for (let raw of lines) {
        let line = raw.trim();
        if (!line) continue;

        // try to find a number and optional unit
        const re = /(\d+[\.,]?\d*)\s*(kg|g|ml|l|litre|liter|dozen)?/i;
        const m = line.match(re);

        let qty = null;
        let unit = null;

        if (m) {
            qty = parseFloat(m[1].replace(',', '.'));
            unit = m[2] ? m[2].toLowerCase() : null;
            // remove the matched quantity+unit from line to extract name
            line = line.replace(m[0], '').trim();
        }

        // if no numeric match, also try patterns like "eggs dozen" or trailing 'dozen'
        if (!m) {
            const dozenRe = /(?:^|\s)(dozen)(?:$|\s)/i;
            if (dozenRe.test(line)) {
                qty = 1;
                unit = 'dozen';
                line = line.replace(dozenRe, '').trim();
            }
        }

        // if quantity still null but line starts with a number (e.g., "2 Apples")
        if (qty === null) {
            const startNum = line.match(/^([\d]+)\s+/);
            if (startNum) {
                qty = parseFloat(startNum[1]);
                line = line.replace(startNum[0], '').trim();
            }
        }

        // default quantity
        if (qty === null) qty = 1;

        // normalize units
        let normalizedQty = qty;
        if (unit) {
            unit = unit.toLowerCase();
            if (unit === 'g') normalizedQty = qty / 1000; // g -> kg
            else if (unit === 'ml') normalizedQty = qty / 1000; // ml -> L
            else if (unit === 'dozen') normalizedQty = qty * 12;
            else normalizedQty = qty; // kg, l, litre, etc.
        }

        // clean item name: remove remaining numbers/units and special chars
        let name = line.replace(/[\d\*#@!\$%\^&\(\)\[\]\{\};:<>\/?\\|~`+=,]+/g, '');
        name = name.replace(/\s{2,}/g, ' ').trim();
        if (!name) continue;

        items.push({ name: name, quantity: Number(normalizedQty) });
    }

    // merge duplicates (case-insensitive)
    const map = {};
    for (const it of items) {
        const key = it.name.toLowerCase();
        if (!map[key]) map[key] = { name: it.name, quantity: 0 };
        map[key].quantity += it.quantity;
    }

    return Object.values(map);
}

exports.pasteList = (req, res) => {
    const { text } = req.body;
    const items = parsePasteText(text);

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No valid items found' });
    }

    db.serialize(() => {
        db.run(`DELETE FROM shopping_list`);

        let done = 0;
        const total = items.length;
        const ambiguousItems = [];
        const missingItems = [];
        const addedItems = [];

        if (total === 0) {
            return res.json({ message: 'Empty list', ambiguousItems: [], missingItems: [], addedItems: [] });
        }

        items.forEach(item => {
            const searchTerm = item.name.trim();
            db.all(
                `SELECT product_id, name, price, image_url, stock 
                 FROM products 
                 WHERE LOWER(name) LIKE LOWER(?)`,
                [`%${searchTerm}%`],
                (err, matches) => {
                    if (err) {
                        console.error("PasteList DB error:", err);
                    } else if (!matches || matches.length === 0) {
                        missingItems.push({ name: searchTerm, qty: item.quantity });
                    } else if (matches.length === 1) {
                        const product = matches[0];
                        db.get(
                            `SELECT stock FROM products WHERE product_id = ?`,
                            [product.product_id],
                            (err2, stockRow) => {
                                if (!err2 && stockRow && stockRow.stock >= (item.quantity || 1)) {
                                    db.run(
                                        `INSERT INTO shopping_list (product_id, quantity, picked, picked_quantity)
                                         VALUES (?, ?, 0, 0)`,
                                        [product.product_id, item.quantity || 1]
                                    );
                                    addedItems.push({ name: searchTerm, product_id: product.product_id });
                                } else {
                                    const reason = (!stockRow || stockRow.stock <= 0) ? "out_of_stock" : "insufficient_stock";
                                    missingItems.push({ 
                                        name: searchTerm, 
                                        qty: item.quantity, 
                                        reason: reason,
                                        available_stock: stockRow ? stockRow.stock : 0
                                    });
                                }
                            }
                        );
                    } else {
                        // Check if there is an exact match that should take precedence
                        const exactMatch = matches.find(m => m.name.toLowerCase() === searchTerm.toLowerCase());
                        if (exactMatch) {
                            db.get(
                                `SELECT stock FROM products WHERE product_id = ?`,
                                [exactMatch.product_id],
                                (err2, stockRow) => {
                                    if (!err2 && stockRow && stockRow.stock >= (item.quantity || 1)) {
                                        db.run(
                                            `INSERT INTO shopping_list (product_id, quantity, picked, picked_quantity)
                                             VALUES (?, ?, 0, 0)`,
                                            [exactMatch.product_id, item.quantity || 1]
                                        );
                                        addedItems.push({ name: searchTerm, product_id: exactMatch.product_id });
                                    } else {
                                        const reason = (!stockRow || stockRow.stock <= 0) ? "out_of_stock" : "insufficient_stock";
                                        missingItems.push({ 
                                            name: searchTerm, 
                                            qty: item.quantity, 
                                            reason: reason,
                                            available_stock: stockRow ? stockRow.stock : 0
                                        });
                                    }
                                }
                            );
                        } else {
                            ambiguousItems.push({
                                enteredName: searchTerm,
                                qty: item.quantity,
                                matches: matches
                            });
                        }
                    }

                    done++;
                    if (done === total) {
                        res.json({
                            message: 'Pasted shopping list processed',
                            ambiguousItems,
                            missingItems,
                            addedItems
                        });
                    }
                }
            );
        });
    });
};