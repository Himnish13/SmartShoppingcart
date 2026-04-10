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

        db.all(`SELECT * FROM shopping_list`, [], async (err, rows) => {

            try {
                await axios.post(`${SERVER_URL}/shopping-list`, {
                    cart_id,
                    items: rows
                });
            } catch (err) {
                console.log("Shopping list sync failed");
            }
        });
    });
};


exports.sendCartItems = () => {

    getCartId((cart_id) => {

        db.all(
            `SELECT product_id, quantity, price_at_scan FROM cart_items`,
            [],
            async (err, rows) => {

                let total = 0;

                rows.forEach(r => {
                    total += r.quantity * r.price_at_scan;
                });

                try {
                    await axios.post(`${SERVER_URL}/cart/checkout`, {
                        cart_id,
                        items: rows,
                        total
                    });
                } catch (err) {
                    console.log("Cart sync failed");
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