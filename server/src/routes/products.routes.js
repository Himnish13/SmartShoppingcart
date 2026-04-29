const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const productController = require("../controllers/product.controller");

router.get("/", productController.getAllProducts);
router.get("/categories", productController.getAllCategories);
router.get("/search", productController.searchProducts);
router.get("/:barcode", productController.getProductByBarcode);

router.post("/", verifyToken, requireRole("ADMIN"), productController.addProduct);
router.put("/:id", verifyToken, requireRole("ADMIN"), productController.updateProduct);
router.patch("/:id/toggle", verifyToken, requireRole("ADMIN"), productController.toggleProduct);
module.exports = router;
