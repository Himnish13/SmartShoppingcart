const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

// Public route
router.post("/login", userController.login);

// Admin-only routes
router.delete("/staff/:id", verifyToken, requireRole("ADMIN"), userController.deleteStaff);
router.get("/staff", verifyToken, requireRole("ADMIN"), userController.getStaff);
router.post("/create",userController.addUser);
module.exports = router;