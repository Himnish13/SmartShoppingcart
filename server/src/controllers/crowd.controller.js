const service = require("../services/crowd.service");

async function getCrowd(req, res) {
  try {
    const data = await service.getCrowd();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function incrementCrowd(req, res) {
  try {
    const { node_id } = req.body;

    if (!node_id) {
      return res.status(400).json({ error: "node_id is required" });
    }

    const result = await service.incrementCrowd(node_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function setCrowd(req, res) {
  try {
    const { node_id, crowd_level } = req.body;

    if (!node_id) {
      return res.status(400).json({ error: "node_id is required" });
    }

    if (!Number.isInteger(crowd_level) || crowd_level < 0) {
      return res.status(400).json({ error: "crowd_level must be a non-negative integer" });
    }

    const result = await service.setCrowdLevel(node_id, crowd_level);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCrowd,
  incrementCrowd,
  setCrowd
};
