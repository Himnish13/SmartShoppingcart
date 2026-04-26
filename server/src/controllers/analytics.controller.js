const analyticsService = require("../services/analytics.service");

async function getKPIMetrics(req, res) {
  try {
    const data = await analyticsService.getKPIMetrics();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch KPI metrics" });
  }
}

async function getRevenueTrend(req, res) {
  try {
    const data = await analyticsService.getRevenueTrend();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch revenue trend" });
  }
}

async function getCategoryShare(req, res) {
  try {
    const data = await analyticsService.getCategoryShare();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch category share" });
  }
}

async function getOrdersAndCustomers(req, res) {
  try {
    const data = await analyticsService.getOrdersAndCustomers();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders and customers" });
  }
}

module.exports = {
  getKPIMetrics,
  getRevenueTrend,
  getCategoryShare,
  getOrdersAndCustomers
};
