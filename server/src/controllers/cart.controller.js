const cartService = require("../services/cart.service");
const cartSyncService = require("../services/cartSync.service");

async function getActiveCarts(req, res) {
  try {
    const data = await cartService.getActiveCarts();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getCartDevices(req, res) {
  try {
    const data = await cartService.getCartDevices();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function startCartSession(req, res) {
  try {
    const data = await cartService.startCartSession(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function stopCartSession(req, res) {
  try {
    const data = await cartService.stopCartSession(req.params.cartId);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function receiveShoppingList(req, res) {
  try {
    const result = await cartSyncService.receiveShoppingList(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function receiveCheckout(req, res) {
  try {
    const result = await cartSyncService.receiveCheckout(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function receiveCurrentCartItems(req, res) {
  try {
    const result = await cartSyncService.receiveCurrentCartItems(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function receivePosition(req, res) {
  try {
    const result = await cartSyncService.receivePosition(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  getActiveCarts,
  getCartDevices,
  startCartSession,
  stopCartSession,
  receiveShoppingList,
  receiveCheckout,
  receiveCurrentCartItems,
  receivePosition
};
