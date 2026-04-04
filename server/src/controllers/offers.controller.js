const offerService = require("../services/offer.service");

async function addOffer(req, res) {
  try {
    await offerService.addOffer(req.body);
    res.json({ message: "Offer added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateOffer(req, res) {
  try {
    const id = req.params.product_id || req.params.id;
    await offerService.updateOffer(id, req.body);
    res.json({ message: "Offer updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteOffer(req, res) {
  try {
    const id = req.params.product_id || req.params.id;
    await offerService.deleteOffer(id);
    res.json({ message: "Offer removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addOffer,
  updateOffer,
  deleteOffer
};