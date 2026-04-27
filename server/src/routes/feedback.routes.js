const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");
const syncController = require("../controllers/sync.controller");

// We might want anyone to post feedback, but to view it might be admin only
router.post("/", feedbackController.createFeedback);
router.post("/bulk", syncController.bulkFeedback);
router.get("/summary", feedbackController.getFeedbackSummary);
router.get("/:productId", feedbackController.getProductFeedback);

module.exports = router;
