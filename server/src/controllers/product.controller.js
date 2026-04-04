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

async function addProduct(req, res) {
  try {
    const result = await productService.addProduct(req.body);
    res.json({ message: "Product added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    await productService.updateProduct(req.params.id, req.body);
    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function toggleProduct(req, res) {
  try {
    await productService.toggleProduct(req.params.id, req.body.is_active);
    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateStock(req, res) {
  try {
    await productService.updateStock(req.params.id, req.body.stock);
    res.json({ message: "Stock updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getProductByBarcode,
  getAllProducts,
  searchProducts,
  addProduct,
  updateProduct,
  toggleProduct,
  updateStock,
  deleteProduct
};