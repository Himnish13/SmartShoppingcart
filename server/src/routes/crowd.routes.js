const express = require("express");
const router = express.Router();
const controller = require("../controllers/crowd.controller");

// Get all crowd data
router.get("/", controller.getCrowd);

// Increment crowd for a specific node (called by carts)
router.post("/increment", controller.incrementCrowd);

module.exports = router;
