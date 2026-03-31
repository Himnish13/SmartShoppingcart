const productModel = require("../models/product.model");

// Get all products
async function fetchAllProducts() {
  return await productModel.getAllProductsFromDB();
}

// Get product by barcode
async function fetchProductByBarcode(barcode) {
  return await productModel.getProductByBarcodeFromDB(barcode);
}

// Search products by name and/or category
async function searchProducts(name, category) {
  return await productModel.searchProductsFromDB(name, category);
}
module.exports = {
  fetchAllProducts,
  fetchProductByBarcode,
  searchProducts
};