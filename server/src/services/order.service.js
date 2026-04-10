const orderModel = require("../models/order.model");

async function getOrders() {
  return await orderModel.getOrders();
}

async function getOrderItems(orderId) {
  return await orderModel.getOrderItems(orderId);
}

async function createOrder(orderData) {
  return await orderModel.createOrder(orderData);
}

module.exports = {
  getOrders,
  getOrderItems,
  createOrder
};