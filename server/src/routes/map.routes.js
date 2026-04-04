const express = require("express");
const router = express.Router();
const mapController = require("../controllers/map.controller");
const { verifyToken, requireRole } = require("../middleware/auth");

router.get("/nodes", mapController.getNodes);
router.get("/edges", mapController.getEdges);
router.get("/poi", mapController.getPOI);

router.post("/upload", verifyToken, requireRole("ADMIN"), mapController.uploadMap);
module.exports = router;