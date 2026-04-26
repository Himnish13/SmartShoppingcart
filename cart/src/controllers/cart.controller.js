const db = require("../config/sqlite");

exports.addItem = (req, res) => {
    const { barcode, quantity } = req.body;
    const qty = quantity || 1;

    db.get(
        `SELECT * FROM products WHERE barcode = ?`,
        [barcode],
        (err, product) => {
            if (err) return res.status(500).json(err);
            if (!product) return res.status(404).json({ message: "Product not found" });

            db.get(
                `SELECT discount FROM offers WHERE product_id = ?`,
                [product.product_id],
                (err, offer) => {

                    let discount = offer?.discount || 0;
                    let finalPrice = product.price * (1 - discount / 100);

                    db.get(
                        `SELECT * FROM cart_items WHERE product_id = ?`,
                        [product.product_id],
                        (err, item) => {
                            const currentQty = item ? item.quantity : 0;
                            const newTotalQty = currentQty + qty;

                            if (newTotalQty > product.stock) {
                                return res.json({
                                    status: "insufficient_stock",
                                    available_stock: product.stock,
                                    product_name: product.name
                                });
                            }

                            if (item) {
                                db.run(
                                    `UPDATE cart_items 
                                     SET quantity = ? 
                                     WHERE product_id = ?`,
                                    [newTotalQty, product.product_id]
                                );
                            } else {
                                db.run(
                                    `INSERT INTO cart_items (product_id, quantity, price_at_scan) 
                                     VALUES (?, ?, ?)`,
                                    [product.product_id, qty, finalPrice]
                                );
                            }

                            // Decrease stock in products table
                            db.run(
                                `UPDATE products SET stock = stock - ? WHERE product_id = ?`,
                                [qty, product.product_id]
                            );

                            db.run(
                                `UPDATE shopping_list
                                 SET picked_quantity = picked_quantity + ?,
                                     picked = CASE 
                                       WHEN picked_quantity + ? >= quantity THEN 1 
                                       ELSE 0 
                                     END
                                 WHERE product_id = ?`,
                                [qty, qty, product.product_id],
                                () => res.json({
                                    status: "added",
                                    message: "Item added & updated",
                                    price_at_scan: finalPrice,
                                    discount_applied: discount
                                })
                            );
                        }
                    );
                }
            );
        }
    );
};

exports.getItems = (req, res) => {
    db.all(
        `SELECT 
            c.id, 
            c.product_id,
            p.name, 
            p.barcode, 
            p.image_url,
            c.quantity, 
            c.price_at_scan,
            cat.category_name
         FROM cart_items c 
         JOIN products p ON c.product_id = p.product_id
         LEFT JOIN category cat ON p.category_id = cat.category_id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};

exports.removeItem = (req, res) => {
    const { barcode, quantity } = req.body;
    const qty = quantity || 1;

    db.get(
        `SELECT product_id FROM products WHERE barcode = ?`,
        [barcode],
        (err, product) => {

            if (!product) return res.status(404).json({ message: "Not found" });

            db.get(
                `SELECT * FROM cart_items WHERE product_id = ?`,
                [product.product_id],
                (err, item) => {

                    if (!item) return res.json({ message: "Item not in cart" });

                    const newQty = item.quantity - qty;

                    if (newQty <= 0) {

                        db.run(
                            `DELETE FROM cart_items WHERE product_id = ?`,
                            [product.product_id]
                        );

                        // Restore stock
                        db.run(
                            `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
                            [item.quantity, product.product_id]
                        );

                        db.run(
                            `UPDATE shopping_list
                             SET picked_quantity = 0, picked = 0
                             WHERE product_id = ?`,
                            [product.product_id],
                            () => res.json({ message: "Item removed completely" })
                        );

                    } else {

                        db.run(
                            `UPDATE cart_items 
                             SET quantity = ? 
                             WHERE product_id = ?`,
                            [newQty, product.product_id]
                        );

                        // Restore partial stock
                        db.run(
                            `UPDATE products SET stock = stock + ? WHERE product_id = ?`,
                            [qty, product.product_id]
                        );

                        db.run(
                            `UPDATE shopping_list
                             SET picked_quantity = MAX(picked_quantity - ?, 0),
                                 picked = CASE 
                                   WHEN MAX(picked_quantity - ?, 0) >= quantity THEN 1 
                                   ELSE 0 
                                 END
                             WHERE product_id = ?`,
                            [qty, qty, product.product_id],
                            () => res.json({ message: "Item reduced" })
                        );
                    }
                }
            );
        }
    );
};

exports.clearCart = (req, res) => {
    db.serialize(() => {
        // Restore all stock from cart items before deleting
        db.all(`SELECT product_id, quantity FROM cart_items`, [], (err, items) => {
            if (!err && items) {
                items.forEach(item => {
                    db.run(`UPDATE products SET stock = stock + ? WHERE product_id = ?`, [item.quantity, item.product_id]);
                });
            }
            
            db.run(`DELETE FROM cart_items`);
            db.run(
                `UPDATE shopping_list 
                 SET picked_quantity = 0, picked = 0`,
                () => res.json({ message: "Cart cleared & stock restored" })
            );
        });
    });
};