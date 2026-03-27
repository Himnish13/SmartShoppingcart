const express = require("express");
const router = express.Router();
const controller = require("../controllers/sync.controller");

router.get("/full", controller.fullSync);

module.exports = router;