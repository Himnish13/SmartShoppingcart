const express = require("express");
const router = express.Router();

const controller = require("../controllers/order.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

// Admin views
router.get("/", verifyToken, requireRole("ADMIN"), controller.getOrders);
router.get("/:id", verifyToken, requireRole("ADMIN"), controller.getOrderItems);

// Cart / User creates order
router.post("/create", controller.createOrder);

module.exports = router;