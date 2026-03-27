const { fetchProducts, fetchMap } = require("../services/sync.service");

async function getProducts(req, res) {
  try {
    const lastSync = req.query.lastSync;
    const data = await fetchProducts(lastSync);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Sync failed" });
  }
}

async function getMap(req, res) {
  try {
    const map = await fetchMap();
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: "Map fetch failed" });
  }
}

module.exports = { getProducts, getMap };