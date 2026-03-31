const productService = require("../services/product.service");

async function getProductByBarcode(req, res) {
  try {
    const { barcode } = req.params;

    const product = await productService.fetchProductByBarcode(barcode);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getAllProducts(req, res) {
  try {
    const products = await productService.fetchAllProducts();
    res.json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function searchProducts(req, res) {
  try {
    const { name, category } = req.query;

    const products = await productService.searchProducts(name, category);

    res.json(products);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
}

module.exports = {
  getProductByBarcode,
  getAllProducts,
  searchProducts
};