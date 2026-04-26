const feedbackModel = require("../models/feedback.model");

async function getFeedbackSummary(req, res) {
  try {
    const summary = await feedbackModel.getProductsWithFeedbackCount();
    res.json(summary);
  } catch (err) {
    console.error("Error in getFeedbackSummary:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function getProductFeedback(req, res) {
  try {
    const { productId } = req.params;
    const feedbacks = await feedbackModel.getFeedbackByProductId(productId);
    res.json(feedbacks);
  } catch (err) {
    console.error("Error in getProductFeedback:", err);
    res.status(500).json({ error: "Server error" });
  }
}

async function createFeedback(req, res) {
  try {
    const result = await feedbackModel.addFeedback(req.body);
    res.status(201).json({ message: "Feedback added", feedback_id: result.insertId });
  } catch (err) {
    console.error("Error in createFeedback:", err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getFeedbackSummary,
  getProductFeedback,
  createFeedback
};
