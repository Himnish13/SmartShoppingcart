const syncService = require("../services/sync.service");
const db = require("../config/db");

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

const bulkFeedback = (req, res) => {
  const { feedbacks } = req.body;

  if (!feedbacks || feedbacks.length === 0) {
    return res.json({ message: "No data" });
  }

  const values = feedbacks.map(f => [
    f.cart_id || null,
    f.product_name || null,
    f.product_id || null,
    f.message || null
  ]);

  db.query(
    `INSERT INTO feedback (cart_id, product_name, product_id, message)
     VALUES ?`,
    [values],
    (err) => {
      if (err) {
        console.error("Feedback insert error:", err);
        return res.status(500).json(err);
      }

      res.json({ message: "Feedback stored in server" });
    }
  );
};

module.exports = {
  fullSync,
  syncProducts,
  syncOffers,
  syncCrowd,
  syncNodes,
  syncEdges,
  syncCategories,
  bulkFeedback
};