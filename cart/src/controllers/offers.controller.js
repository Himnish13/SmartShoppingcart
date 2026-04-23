const db = require("../config/sqlite");

exports.getAllOffers = (req, res) => {
    db.all(
        `SELECT o.product_id, o.discount, p.name, p.barcode, p.image_url, p.price, p.category_id, c.category_name
         FROM offers o
         JOIN products p ON o.product_id = p.product_id
         LEFT JOIN category c ON p.category_id = c.category_id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows);
        }
    );
};
