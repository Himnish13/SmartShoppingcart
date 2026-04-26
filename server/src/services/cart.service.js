const cartModel = require("../models/cartSession.model");

async function getActiveCarts() {
  const carts = await cartModel.getActiveCartsFromDB();

  // Fetch items for each cart
  const cartsWithItems = await Promise.all(
    carts.map(async (cart) => {
      let items = [];
      try {
        if (cart.cart_id && cart.user_id) {
          items = await cartModel.getCartItems(cart.cart_id, cart.user_id);
        }
      } catch (e) {
        console.error("Failed to fetch cart items", e);
      }

      return {
        id: cart.session_id || cart.id,
        customer: cart.customer_name || cart.phone_number || "Unknown",
        email: cart.email || "unknown@example.com",
        items: items,
        updatedAt: cart.updated_at || cart.started_at || new Date().toISOString(),
        status: cart.status || "active",
        location: cart.location || "Unknown Location"
      };
    })
  );

  return cartsWithItems;
}

module.exports = {
  getActiveCarts
};