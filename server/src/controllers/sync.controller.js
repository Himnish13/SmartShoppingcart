const syncService = require("../services/sync.service");

// FULL SYNC
const fullSync = async (req, res) => {
  try {
    const data = await syncService.fetchFullSync();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Full sync failed" });
  }
};

// INDIVIDUAL SYNC

const syncProducts = async (req, res) => {
  try {
    const data = await syncService.fetchProductsSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Products sync failed" });
  }
};

const syncOffers = async (req, res) => {
  try {
    const data = await syncService.fetchOffersSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Offers sync failed" });
  }
};

const syncCrowd = async (req, res) => {
  try {
    const data = await syncService.fetchCrowdSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Crowd sync failed" });
  }
};

const syncNodes = async (req, res) => {
  try {
    const data = await syncService.fetchNodesSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Nodes sync failed" });
  }
};

const syncEdges = async (req, res) => {
  try {
    const data = await syncService.fetchEdgesSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Edges sync failed" });
  }
};

const syncCategories = async (req, res) => {
  try {
    const data = await syncService.fetchCategoriesSync();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Categories sync failed" });
  }
};

module.exports = {
  fullSync,
  syncProducts,
  syncOffers,
  syncCrowd,
  syncNodes,
  syncEdges,
  syncCategories
};