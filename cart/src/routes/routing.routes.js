const express = require("express");
const router = express.Router();
const controller = require("../controllers/routing.controller");

// ✅ MAIN ROUTING ENDPOINTS
router.post("/generate", controller.getRoute);
router.get("/nodes", controller.getNodes);
router.get("/store-layout", controller.getStoreLayout);

module.exports = router;