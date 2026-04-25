const express = require("express");
const router = express.Router();

const { verifyToken, requireRole } = require("../middleware/auth");

const productController = require("../controllers/product.controller");
const mapController = require("../controllers/map.controller");
const userController = require("../controllers/user.controller");
// const syncController = require("../controllers/sync.controller");
const offersController = require("../controllers/offers.controller");
const crowdController = require("../controllers/crowd.controller");


router.post(
  "/products",
  verifyToken,
  requireRole("ADMIN"),
  productController.addProduct
);

router.put(
  "/products/:id",
  verifyToken,
  requireRole("ADMIN"),
  productController.updateProduct
);

router.put(
  "/products/:id/stock",
  verifyToken,
  requireRole("ADMIN"),
  productController.updateStock
);

router.patch(
  "/products/:id/status",
  verifyToken,
  requireRole("ADMIN"),
  productController.toggleProduct
);

router.delete(
  "/products/:id",
  verifyToken,
  requireRole("ADMIN"),
  productController.deleteProduct
);

router.post(
  "/map/upload",
  verifyToken,
  requireRole("ADMIN"),
  mapController.uploadMap
);

router.put(
  "/map/nodes",
  verifyToken,
  requireRole("ADMIN"),
  mapController.updateNodes
);

router.put(
  "/map/edges",
  verifyToken,
  requireRole("ADMIN"),
  mapController.updateEdges
);

router.put(
  "/map/category-mapping",
  verifyToken,
  requireRole("ADMIN"),
  mapController.updateCategoryMapping
);


router.post(
  "/offers",
  verifyToken,
  requireRole("ADMIN"),
  offersController.addOffer
);

router.put(
  "/offers/:product_id",
  verifyToken,
  requireRole("ADMIN"),
  offersController.updateOffer
);

router.delete(
  "/offers/:product_id",
  verifyToken,
  requireRole("ADMIN"),
  offersController.deleteOffer
);


router.post(
  "/staff",
  verifyToken,
  requireRole("ADMIN"),
  userController.addUser
);

router.delete(
  "/staff/:id",
  verifyToken,
  requireRole("ADMIN"),
  userController.deleteStaff
);

router.get(
  "/staff",
  verifyToken,
  requireRole("ADMIN"),
  userController.getStaff
);


router.get(
  "/crowd",
  verifyToken,
  requireRole("ADMIN"),
  crowdController.getCrowd
);

// router.get(
//   "/analytics/demand",
//   verifyToken,
//   requireRole("ADMIN"),
//   require("../controllers/order.controller").getDemand
// );

// router.get(
//   "/analytics/cart-activity",
//   verifyToken,
//   requireRole("ADMIN"),
//   require("../controllers/cart.controller").getCartActivity
// );

// router.get(
//   "/carts/active",
//   verifyToken,
//   requireRole("ADMIN"),
//   require("../controllers/cart.controller").getActiveCarts
// );


// router.post(
//   "/sync/trigger",
//   verifyToken,
//   requireRole("ADMIN"),
//   syncController.triggerSync
// );

module.exports = router;