const express = require("express");
const router = express.Router();
const controller = require("../controllers/routing.controller");

router.post("/generate", controller.getRoute);

module.exports = router;