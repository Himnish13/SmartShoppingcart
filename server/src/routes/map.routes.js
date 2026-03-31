const express = require("express");
const router = express.Router();
const mapController = require("../controllers/map.controller");

router.get("/nodes", mapController.getNodes);
router.get("/edges", mapController.getEdges);
router.get("/poi", mapController.getPOI);

module.exports = router;