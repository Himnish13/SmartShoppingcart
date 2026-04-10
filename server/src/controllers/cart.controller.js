const cartService = require("../services/cart.service");

async function getActiveCarts(req, res) {
  try {
    const data = await cartService.getActiveCarts();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getActiveCarts
};