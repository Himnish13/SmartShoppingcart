const router = require("express").Router();
const controller = require("../controllers/mobile.controller");

router.get("/", controller.serveMobilePage);
router.get("/status", controller.getStatus);
router.post("/status", controller.setStatus);
router.post("/submit", controller.submitList);

module.exports = router;
