const productModel = require("../models/product.model");

// Transform database format to frontend format
function transformProduct(dbProduct) {
  return {
    id: dbProduct.product_id,
    name: dbProduct.name,
    sku: dbProduct.barcode,
    category: dbProduct.category_name || "Uncategorized",
    price: Number(dbProduct.price) || 0,
    stock: Number(dbProduct.stock) || 0,
    status: dbProduct.is_active ? "active" : "inactive",
  };
}

// Get all products
async function fetchAllProducts() {
  const products = await productModel.getAllProductsFromDB();
  return products.map(transformProduct);
}

// Get product by barcode
async function fetchProductByBarcode(barcode) {
  const product = await productModel.getProductByBarcodeFromDB(barcode);
  return product ? transformProduct(product) : null;
}

// Search products by name and/or category
async function searchProducts(name, category) {
  const products = await productModel.searchProductsFromDB(name, category);
  return products.map(transformProduct);
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