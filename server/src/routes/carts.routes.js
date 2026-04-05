const express = require("express");
const router = express.Router();
const controller = require("../controllers/cart.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/active", verifyToken, requireRole("ADMIN"), controller.getActiveCarts);

module.exports = router;