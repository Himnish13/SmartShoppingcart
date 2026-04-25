const API_BASE = "http://localhost:3200";
const CART_API = "http://localhost:3500"; // Shopping list API

const getHeaders = () => {
  return {
    "Content-Type": "application/json",
  };
};

export const apiService = {

  // ========== PRODUCTS ==========
  async getAllProducts() {
    const response = await fetch(`${API_BASE}/products`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  async addProduct(productData) {
    const response = await fetch(`${API_BASE}/admin/products`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error("Failed to add product");
    return response.json();
  },

  async updateProduct(id, productData) {
    const response = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });
    if (!response.ok) throw new Error("Failed to update product");
    return response.json();
  },

  async deleteProduct(id) {
    const response = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete product");
    return response.json();
  },

  async updateStock(id, stock) {
    const response = await fetch(`${API_BASE}/admin/products/${id}/stock`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ stock }),
    });
    if (!response.ok) throw new Error("Failed to update stock");
    return response.json();
  },

  // ========== OFFERS ==========
  async addOffer(offerData) {
    const response = await fetch(`${API_BASE}/admin/offers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        product_id: offerData.product_id,
        discount_percent: offerData.discount_percentage,
        valid_from: offerData.valid_from,
        valid_until: offerData.valid_until,
      }),
    });
    if (!response.ok) throw new Error("Failed to add offer");
    return response.json();
  },

  async updateOffer(productId, offerData) {
    const response = await fetch(`${API_BASE}/admin/offers/${productId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({
        discount_percent: offerData.discount_percentage,
        valid_from: offerData.valid_from,
        valid_until: offerData.valid_until,
      }),
    });
    if (!response.ok) throw new Error("Failed to update offer");
    return response.json();
  },

  async deleteOffer(productId) {
    const response = await fetch(`${API_BASE}/admin/offers/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete offer");
    return response.json();
  },

  // ========== CARTS ==========
  async getActiveCarts() {
    const response = await fetch(`${API_BASE}/admin/crowd`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch carts");
    return response.json();
  },

  // ========== CROWD DATA ==========
  async getCrowdData() {
    const response = await fetch(`${API_BASE}/admin/crowd`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch crowd data");
    return response.json();
  },

  // ========== ORDERS/BILLS ==========
  async generateBill(cartId) {
    const response = await fetch(`${API_BASE}/orders/${cartId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to generate bill");
    return response.json();
  },

  // ========== SHOPPING LISTS ==========
  async getShoppingLists() {
    const response = await fetch(`${CART_API}/shopping-list/items`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch shopping lists");
    return response.json();
  },

  async addToShoppingList(productId, quantity) {
    const response = await fetch(`${CART_API}/shopping-list/add`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!response.ok) throw new Error("Failed to add to shopping list");
    return response.json();
  },

  async updateShoppingListQuantity(productId, quantity) {
    const response = await fetch(`${CART_API}/shopping-list/update`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    if (!response.ok) throw new Error("Failed to update quantity");
    return response.json();
  },

  async removeFromShoppingList(productId) {
    const response = await fetch(`${CART_API}/shopping-list/remove`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ product_id: productId }),
    });
    if (!response.ok) throw new Error("Failed to remove from shopping list");
    return response.json();
  },

  async clearShoppingList() {
    const response = await fetch(`${CART_API}/shopping-list/clear`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Failed to clear shopping list");
    return response.json();
  },
};
