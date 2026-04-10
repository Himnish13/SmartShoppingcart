const service = require("../services/crowd.service");

async function getCrowd(req, res) {
  try {
    const data = await service.getCrowd();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCrowd
};