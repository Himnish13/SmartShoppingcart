const orderModel = require("../models/order.model");

async function getOrders() {
  const orders = await orderModel.getOrders();

  // Fetch items for each order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const orderId = order.order_id || order.id;
      let items = [];
      try {
        const rawItems = await orderModel.getOrderItems(orderId);
        items = rawItems.map(i => ({
          name: i.name || `Product #${i.product_id}`,
          qty: i.quantity,
          price: Number(i.price_at_time || 0),
          product_id: i.product_id
        }));
      } catch (e) {
        // If items fetch fails, continue with empty items
      }

      return {
        id: orderId,
        number: order.order_number || `INV-${orderId}`,
        customer: order.customer_name || "Unknown",
        email: order.email || "unknown@example.com",
        items,
        subtotal: Number(order.subtotal || order.total_amount || 0),
        tax: Number(order.tax || 0),
        total: Number(order.total_amount || 0),
        status: order.status || "unpaid",
        issuedAt: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        dueAt: order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      };
    })
  );

  return ordersWithItems;
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