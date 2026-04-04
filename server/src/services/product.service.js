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

function addProduct(data) {
  return productModel.insertProduct(data);
}

function updateProduct(id, data) {
  return productModel.updateProduct(id, data);
}

function toggleProduct(id, status) {
  return productModel.toggleProduct(id, status);
}

function updateStock(id, stock) {
  return productModel.updateStock(id, stock);
}

function deleteProduct(id) {
  return productModel.deleteProduct(id);
}

module.exports = {
  fetchAllProducts,
  fetchProductByBarcode,
  searchProducts,
  addProduct,
  updateProduct,
  toggleProduct,
  updateStock,
  deleteProduct
};