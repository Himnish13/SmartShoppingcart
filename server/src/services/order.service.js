const orderModel = require("../models/order.model");

async function getOrders() {
  const orders = await orderModel.getOrders();

  // Transform database format to frontend format
  return orders.map(order => ({
    id: order.order_id || order.id,
    number: order.order_number || `INV-${order.order_id}`,
    customer: order.customer_name || "Unknown",
    email: order.email || "unknown@example.com",
    items: order.items ? (Array.isArray(order.items) ? order.items : []) : [],
    subtotal: order.subtotal || order.total_amount || 0,
    tax: order.tax || 0,
    total: order.total_amount || 0,
    status: order.status || "unpaid",
    issuedAt: order.created_at ? order.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    dueAt: order.due_date ? order.due_date.split('T')[0] : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  }));
}

async function getOrderItems(orderId) {
  return await orderModel.getOrderItems(orderId);
}

async function createOrder(orderData) {
  return await orderModel.createOrder(orderData);
}

async function updateOrder(orderId, orderData) {
  return await orderModel.updateOrder(orderId, orderData);
}

async function deleteOrder(orderId) {
  return await orderModel.deleteOrder(orderId);
}

module.exports = {
  getOrders,
  getOrderItems,
  createOrder,
  updateOrder,
  deleteOrder
};