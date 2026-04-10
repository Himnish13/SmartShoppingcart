const express = require("express");
const router = express.Router();
const controller = require("../controllers/sync.controller");

// FULL SYNC
router.get("/full", controller.fullSync);

// INDIVIDUAL SYNC
router.get("/products", controller.syncProducts);
router.get("/offers", controller.syncOffers);
router.get("/crowd", controller.syncCrowd);
router.get("/nodes", controller.syncNodes);
router.get("/edges", controller.syncEdges);
router.get("/categories", controller.syncCategories);

module.exports = router;