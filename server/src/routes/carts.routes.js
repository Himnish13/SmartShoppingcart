const express = require("express");
const router = express.Router();
const controller = require("../controllers/cart.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/active", verifyToken, requireRole("ADMIN"), controller.getActiveCarts);
router.get("/devices", verifyToken, requireRole("ADMIN"), controller.getCartDevices);
router.post("/start", verifyToken, requireRole("ADMIN"), controller.startCartSession);
router.post("/:cartId/stop", verifyToken, requireRole("ADMIN"), controller.stopCartSession);

module.exports = router;
