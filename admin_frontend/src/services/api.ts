const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3200";

// Get token from localStorage
const getToken = () => localStorage.getItem("authToken");

const makeRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
  body?: any
) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "API request failed");
  }

  return response.json();
};

// Products API
export const api = {
  // Products
  getAllProducts: async () => {
    try {
      const response = await makeRequest("/products");
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("Failed to fetch products:", error);
      return [];
    }
  },
  getProductById: (id: string) => makeRequest(`/products/${id}`),
  searchProducts: (name?: string, category?: string) => {
    const params = new URLSearchParams();
    if (name) params.append("name", name);
    if (category) params.append("category", category);
    return makeRequest(`/products/search?${params}`);
  },
  addProduct: (product: any) => makeRequest("/admin/products", "POST", {
    barcode: product.sku,
    name: product.name,
    price: product.price,
    category_id: product.category,
    stock: product.stock,
  }),
  updateProduct: (id: string, product: any) =>
    makeRequest(`/admin/products/${id}`, "PUT", {
      name: product.name,
      price: product.price,
      category_id: product.category,
      stock: product.stock,
      is_active: product.status === "active",
    }),
  deleteProduct: (id: string) => makeRequest(`/admin/products/${id}`, "DELETE"),
  updateProductStatus: (id: string, status: boolean) =>
    makeRequest(`/admin/products/${id}/status`, "PATCH", { is_active: status }),
  updateProductStock: (id: string, stock: number) =>
    makeRequest(`/admin/products/${id}/stock`, "PUT", { stock }),

  // Offers
  getOffers: () => makeRequest("/admin/offers"),
  addOffer: (offer: any) => makeRequest("/admin/offers", "POST", {
    product_id: offer.productId,
    discount_percent: offer.discountPct,
    valid_from: offer.startsAt,
    valid_until: offer.endsAt,
  }),
  updateOffer: (productId: string, offer: any) =>
    makeRequest(`/admin/offers/${productId}`, "PUT", {
      discount_percent: offer.discountPct,
      valid_from: offer.startsAt,
      valid_until: offer.endsAt,
    }),
  deleteOffer: (productId: string) => makeRequest(`/admin/offers/${productId}`, "DELETE"),

  // Carts
  getCarts: async () => {
    try {
      const response = await makeRequest("/admin/carts");
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("Failed to fetch carts:", error);
      return [];
    }
  },

  // Bills (Orders)
  getBills: async () => {
    try {
      const response = await makeRequest("/admin/bills");
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("Failed to fetch bills:", error);
      return [];
    }
  },
  getBillItems: (id: string) => makeRequest(`/admin/bills/${id}`),
  createBill: (billData: any) => makeRequest("/admin/bills", "POST", billData),
  updateBill: (id: string, billData: any) => makeRequest(`/admin/bills/${id}`, "PUT", billData),
  deleteBill: (id: string) => makeRequest(`/admin/bills/${id}`, "DELETE"),

  // Staff
  getStaff: () => makeRequest("/admin/staff"),
  addStaff: (staff: any) => makeRequest("/admin/staff", "POST", staff),
  deleteStaff: (id: string) => makeRequest(`/admin/staff/${id}`, "DELETE"),

  // Analytics
  getCrowd: () => makeRequest("/admin/crowd"),

  // Analytics Charts
  getRevenueTrend: async () => {
    try {
      const response = await makeRequest("/admin/analytics/revenue-trend");
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Failed to fetch revenue trend:", error);
      return [];
    }
  },
  getCategoryShare: async () => {
    try {
      const response = await makeRequest("/admin/analytics/category-share");
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Failed to fetch category share:", error);
      return [];
    }
  },
  getOrdersCustomers: async () => {
    try {
      const response = await makeRequest("/admin/analytics/orders-customers");
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error("Failed to fetch orders and customers:", error);
      return [];
    }
  },

  // Feedback
  getFeedbackSummary: async () => {
    try {
      const response = await makeRequest("/feedback/summary");
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error("Failed to fetch feedback summary:", error);
      return [];
    }
  },
  getProductFeedback: async (productId: string) => {
    try {
      const response = await makeRequest(`/feedback/${productId}`);
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error(`Failed to fetch feedback for product ${productId}:`, error);
      return [];
    }
  },
};
