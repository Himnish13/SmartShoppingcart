const express = require("express");
const router = express.Router();
const controller = require("../controllers/position.controller");

router.get("/current", controller.getCurrent);
router.post("/ble", controller.postBle);
router.post("/imu", controller.postImu);
router.post("/reset", controller.reset);

module.exports = router;