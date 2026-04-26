const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middleware/auth");

const productController = require("../controllers/product.controller");
const crowdController = require("../controllers/crowd.controller");
const feedbackController = require("../controllers/feedback.controller");


router.put(
  "/products/:id/stock",
  verifyToken,
  requireRole("STAFF"),
  productController.updateStock
);

router.patch(
  "/products/:id/status",
  verifyToken,
  requireRole("STAFF"),
  productController.toggleProduct
);


// router.get(
//   "/requests",
//   verifyToken,
//   requireRole("STAFF"),
//   productController.getRequestedItems
// );

// router.put(
//   "/requests/:id/restock",
//   verifyToken,
//   requireRole("STAFF"),
//   productController.markRestocked
// );


router.get(
  "/crowd",
  verifyToken,
  requireRole("STAFF"),
  crowdController.getCrowd
);

router.post(
  "/feedback/bulk",
  verifyToken,
  requireRole("STAFF"),
  feedbackController.createFeedback
);

module.exports = router;