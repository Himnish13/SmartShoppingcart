const { fetchProductByBarcode } = require("../services/product.service");

async function getProductByBarcode(req, res) {
  try {
    const { barcode } = req.params;

    const product = await fetchProductByBarcode(barcode);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getProductByBarcode };