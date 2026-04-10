const axios = require("axios");
const db = require("../config/sqlite");

const SERVER_URL = "http://MAIN_SERVER_URL";

function getCartId(callback) {
    db.get(`SELECT cart_id FROM user_session LIMIT 1`, (err, row) => {
        if (err || !row) {
            console.log("Cart ID not found");
            return callback("C1");
        }
        callback(row.cart_id);
    });
}

exports.sendShoppingList = () => {

    getCartId((cart_id) => {

        db.all(
            `SELECT 
                s.product_id,
                p.name,
                p.barcode,
                s.quantity,
                s.picked
             FROM shopping_list s
             JOIN products p ON s.product_id = p.product_id`,
            [],
            async (err, rows) => {

                if (err) {
                    console.log("DB error:", err);
                    return;
                }

                try {
                    await axios.post(`${SERVER_URL}/shopping-list`, {
                        cart_id,
                        items: rows
                    });
                } catch (err) {
                    console.log("Shopping list sync failed:", err.message);
                }
            }
        );
    });
};

exports.sendCartItems = () => {

    getCartId((cart_id) => {

        db.all(
            `SELECT product_id, quantity, price_at_scan FROM cart_items`,
            [],
            async (err, rows) => {

                if (err) {
                    console.log("DB error:", err);
                    return;
                }

                let total = 0;

                rows.forEach(r => {
                    const qty = Number(r.quantity) || 0;
                    const price = Number(r.price_at_scan) || 0;
                    total += qty * price;
                });

                try {
                    await axios.post(`${SERVER_URL}/cart/checkout`, {
                        cart_id,
                        items: rows,
                        total
                    });
                } catch (err) {
                    console.log("Cart sync failed:", err.message);
                }
            }
        );
    });
};

exports.sendPosition = (node_id) => {

    getCartId(async (cart_id) => {

        try {
            await axios.post(`${SERVER_URL}/cart-position`, {
                cart_id,
                node_id,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            console.log("Position send failed:", err.message);
        }
    });
};