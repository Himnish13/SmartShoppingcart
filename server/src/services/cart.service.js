const cartModel = require("../models/cartSession.model");

async function getActiveCarts() {
  const carts = await cartModel.getActiveCartsFromDB();

  // Transform database format to frontend format
  return carts.map(cart => ({
    id: cart.session_id || cart.id,
    customer: cart.customer_name || "Unknown",
    email: cart.email || "unknown@example.com",
    items: cart.items ? (Array.isArray(cart.items) ? cart.items : JSON.parse(cart.items || "[]")) : [],
    updatedAt: cart.updated_at || cart.updatedAt || new Date().toISOString(),
    status: cart.status || "active",
    location: cart.location || "Unknown Location"
  }));
}

module.exports = {
  getActiveCarts
};