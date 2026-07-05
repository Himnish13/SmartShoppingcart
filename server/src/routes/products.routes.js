const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middleware/auth");
const productController = require("../controllers/product.controller");

const upload = require("../middleware/upload");
router.get("/", productController.getAllProducts);
router.get("/categories", productController.getAllCategories);
router.get("/search", productController.searchProducts);
router.get("/:barcode", productController.getProductByBarcode);


router.post(
  "/",
  verifyToken,
  requireRole("ADMIN"),
  upload.single("image"),
  productController.addProduct
);
router.put(
  "/:id",
  verifyToken,
  requireRole("ADMIN"),
  upload.single("image"),
  productController.updateProduct
);
router.patch("/:id/toggle", verifyToken, requireRole("ADMIN"), productController.toggleProduct);
module.exports = router;
