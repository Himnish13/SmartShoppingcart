const express = require("express");
const router = express.Router();
const controller = require("../controllers/sync.controller");

router.get("/full", controller.fullSync);
router.post("/push/shopping-list", controller.pushShoppingList);
router.post("/push/cart", controller.pushCartItems);
router.post("/push/checkout", controller.pushCheckout);
router.post("/push/position", controller.pushPosition);
router.post("/push/feedback", controller.pushFeedback);

// Debug endpoint to test sync
router.get("/debug/status", (req, res) => {
  const SERVER_URL = process.env.SERVER_URL || "http://10.76.31.249:3200";
  res.json({
    status: "Sync system operational",
    SERVER_URL,
    timestamp: new Date().toISOString(),
    endpoints: {
      full_sync: "/sync/full",
      debug_status: "/sync/debug/status",
      push_shopping_list: "POST /sync/push/shopping-list",
      push_cart: "POST /sync/push/cart",
      push_checkout: "POST /sync/push/checkout",
      push_position: "POST /sync/push/position",
      push_feedback: "POST /sync/push/feedback"
    }
  });
});

module.exports = router;
