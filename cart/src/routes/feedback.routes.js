const express = require("express");
const router = express.Router();
const controller = require("../controllers/feedback.controller");

router.post("/add", controller.addFeedback);
router.post("/clear", controller.clearFeedback);

module.exports = router;