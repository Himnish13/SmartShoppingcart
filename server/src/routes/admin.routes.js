const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");
const mapController = require("../controllers/map.controller");
const userController = require("../controllers/user.controller");
const offersController = require("../controllers/offers.controller");
const crowdController = require("../controllers/crowd.controller");


router.post(
  "/products",
  productController.addProduct
);

router.put(
  "/products/:id",
  productController.updateProduct
);

router.put(
  "/products/:id/stock",
  productController.updateStock
);

router.patch(
  "/products/:id/status",
  productController.toggleProduct
);

router.delete(
  "/products/:id",
  productController.deleteProduct
);

router.post(
  "/map/upload",
  mapController.uploadMap
);

router.put(
  "/map/nodes",
  mapController.updateNodes
);

router.put(
  "/map/edges",
  mapController.updateEdges
);

router.put(
  "/map/category-mapping",
  mapController.updateCategoryMapping
);


router.post(
  "/offers",
  offersController.addOffer
);

router.put(
  "/offers/:product_id",
  offersController.updateOffer
);

router.delete(
  "/offers/:product_id",
  offersController.deleteOffer
);


router.post(
  "/staff",
  userController.addUser
);

router.delete(
  "/staff/:id",
  userController.deleteStaff
);

router.get(
  "/staff",
  userController.getStaff
);


router.get(
  "/crowd",
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