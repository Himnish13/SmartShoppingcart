const router = require("express").Router();
const controller = require("../controllers/recommendations.controller");

router.post("/near", controller.getNearbyRecommendations);

module.exports = router;