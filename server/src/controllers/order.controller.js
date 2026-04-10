const orderService = require("../services/order.service");

async function getOrders(req, res) {
  try {
    const data = await orderService.getOrders();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOrderItems(req, res) {
  try {
    const data = await orderService.getOrderItems(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createOrder(req, res) {
  try {
    const result = await orderService.createOrder(req.body);
    res.json({ message: "Order placed", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getOrders,
  getOrderItems,
  createOrder
};