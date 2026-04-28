const db = require("../config/sqlite");
const { normalizeRowsImageUrls } = require("../utils/imageUrl");

exports.getAllProducts = (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(normalizeRowsImageUrls(req, rows));
    });
};

exports.getProductByCategory = (req, res) => {
    const categoryId = req.params.categoryId;

    db.all(
        `SELECT p.*, c.category_name
         FROM products p
         LEFT JOIN category c
         ON p.category_id = c.category_id
         WHERE p.category_id = ?`,
        [categoryId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(normalizeRowsImageUrls(req, rows));
        }
    );
};

exports.getCategories = (req, res) => { 
    db.all(`SELECT * FROM category`, [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
};
