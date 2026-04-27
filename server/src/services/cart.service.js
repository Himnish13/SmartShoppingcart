const cartModel = require("../models/cartSession.model");

async function getActiveCarts() {
  const carts = await cartModel.getActiveCartsFromDB();

  // Fetch items for each cart
  const cartsWithItems = await Promise.all(
    carts.map(async (cart) => {
      let items = [];
      try {
        if (cart.cart_id) {
          items = await cartModel.getCartItems(cart.cart_id);
        }
      } catch (e) {
        console.error("Failed to fetch cart items", e);
      }

      return {
        id: cart.session_id || cart.id,
        cartId: cart.cart_id,
        customer: cart.customer_name || cart.phone_number || "Unknown",
        email: cart.email || "unknown@example.com",
        items: items,
        updatedAt: cart.last_seen || cart.started_at || new Date().toISOString(),
        status: String(cart.status || "ACTIVE").toLowerCase(),
        location: cart.location || "Unknown Location"
      };
    })
  );

  return cartsWithItems;
}

async function getCartDevices() {
  return await cartModel.getCartDevices();
}

async function startCartSession(data) {
  return await cartModel.startCartSession(data.cart_id, data.user_id);
}

async function stopCartSession(cartId) {
  return await cartModel.stopCartSession(cartId);
}

module.exports = {
  getActiveCarts,
  getCartDevices,
  startCartSession,
  stopCartSession
};
