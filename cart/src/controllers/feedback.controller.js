const db = require("../config/sqlite");

exports.addFeedback = (req, res) => {
  const { cart_id, product_name, product_id, message } = req.body;

  db.run(
    `INSERT INTO feedback (product_name, product_id, message)
     VALUES (?, ?, ?)`,
    [product_name, product_id || null, message || null],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({ message: "Feedback stored locally" });
    }
  );
};