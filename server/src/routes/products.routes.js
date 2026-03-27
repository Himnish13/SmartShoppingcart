const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:barcode", (req, res) => {
  const { barcode } = req.params;

  const query = `
    SELECT p.product_id, p.barcode, p.name, p.category, p.price, pl.node_id
    FROM product_mastery p
    JOIN product_location pl ON p.product_id = pl.product_id
    WHERE p.barcode = ?
  `;

  db.query(query, [barcode], (err, result) => {
    if (err) return res.status(500).send(err);

    if (result.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(result[0]);
  });
});

module.exports = router;