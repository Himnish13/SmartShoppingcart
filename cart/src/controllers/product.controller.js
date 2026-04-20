const db = require("../config/sqlite");

exports.getAllProducts = (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
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
            res.json(rows);
        }
    );
};

exports.getCategories = (req, res) => { 
    db.all(`SELECT * FROM category`, [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
};