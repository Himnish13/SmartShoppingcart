const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");

router.get("/", productController.getAllProducts);
router.get("/search", productController.searchProducts);
router.get("/:barcode", productController.getProductByBarcode);


module.exports = router;