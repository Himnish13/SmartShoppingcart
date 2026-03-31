const mapService = require("../services/map.service");

const getNodes = async (req, res) => {
  try {
    const data = await mapService.fetchNodes();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
};

const getEdges = async (req, res) => {
  try {
    const data = await mapService.fetchEdges();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch edges" });
  }
};

const getPOI = async (req, res) => {
  try {
    const data = await mapService.fetchPOI();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch POI" });
  }
};

module.exports = {
  getNodes,
  getEdges,
  getPOI
};