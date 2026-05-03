const express = require("express");
const router = express.Router();

// const { verifyToken, requireRole } = require("../middleware/auth");

const productController = require("../controllers/product.controller");
const mapController = require("../controllers/map.controller");
const userController = require("../controllers/user.controller");
// const syncController = require("../controllers/sync.controller");
const offersController = require("../controllers/offers.controller");
const crowdController = require("../controllers/crowd.controller");
const cartController = require("../controllers/cart.controller");
const orderController = require("../controllers/order.controller");
const analyticsController = require("../controllers/analytics.controller");


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


router.get(
  "/offers",
  offersController.getOffers
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

router.put(
  "/crowd",
  crowdController.setCrowd
);

router.get(
  "/carts",
  cartController.getActiveCarts
);

router.get(
  "/bills",
  orderController.getOrders
);

router.get(
  "/bills/:id",
  orderController.getOrderItems
);

router.post(
  "/bills",
  orderController.createOrder
);

router.put(
  "/bills/:id",
  orderController.updateOrder
);

router.delete(
  "/bills/:id",
  orderController.deleteOrder
);

router.get(
  "/analytics/revenue-trend",
  analyticsController.getRevenueTrend
);

router.get(
  "/analytics/category-share",
  analyticsController.getCategoryShare
);

router.get(
  "/analytics/orders-customers",
  analyticsController.getOrdersAndCustomers
);

// Development: Seed sample analytics data
router.post(
  "/analytics/seed-data",
  async (req, res) => {
    try {
      const db = require("../config/db");

      // Insert sample orders
      const orders = [];
      for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 180);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        const amount = Math.random() * 500 + 50;
        orders.push([1, 1, amount, 'completed']);
      }

      const insertQuery = `INSERT INTO orders (user_id, cart_id, total_amount, status) VALUES ?`;
      db.query(insertQuery, [orders], (err) => {
        if (err) {
          console.error("Seed error:", err);
          return res.status(500).json({ error: "Failed to seed data" });
        }
        res.json({ message: "Sample data seeded successfully", count: orders.length });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
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
