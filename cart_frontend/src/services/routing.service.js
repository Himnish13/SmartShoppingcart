// ✅ Routing Service - Handles all routing-related API calls

const API_BASE = "http://localhost:3500";

export const routingService = {
  /**
   * Generate route for selected products
   * @param {number} startNode - Starting node ID (usually 1 for entrance)
   * @param {number[]} productIds - Array of product IDs to include in route
   * @returns {Promise} Route data with path and crowd info
   */
  generateRoute: async (startNode, productIds) => {
    try {
      const response = await fetch(`${API_BASE}/routing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
          productIds: productIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to generate route`);
      }

      return await response.json();
    } catch (error) {
      console.error("Routing Service Error:", error);
      throw error;
    }
  },

  /**
   * Generate route for all shopping list items
   * @param {number} startNode - Starting node ID
   * @returns {Promise} Route data with path and crowd info
   */
  generateRouteForAll: async (startNode) => {
    try {
      const response = await fetch(`${API_BASE}/routing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to generate route`);
      }

      return await response.json();
    } catch (error) {
      console.error("Routing Service Error:", error);
      throw error;
    }
  },

  /**
   * Generate route for a single product
   * @param {number} startNode - Starting node ID
   * @param {number} productId - Product ID
   * @returns {Promise} Route data with path
   */
  generateSingleRoute: async (startNode, productId) => {
    try {
      const response = await fetch(`${API_BASE}/routing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
          productId: productId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to generate route`);
      }

      return await response.json();
    } catch (error) {
      console.error("Routing Service Error:", error);
      throw error;
    }
  },

  /**
   * Calculate distance/time for a route
   * @param {Array} path - Array of nodes in the path
   * @returns {number} Total distance/steps in the path
   */
  calculateRouteLength: (path) => {
    return path ? path.length : 0;
  },

  /**
   * Get crowd density for a specific zone
   * @param {Object} crowdData - Crowd data object
   * @param {string} zone - Zone name
   * @returns {number} Density percentage (0-1)
   */
  getCrowdDensity: (crowdData, zone) => {
    if (!crowdData || !crowdData[zone]) return 0;
    return crowdData[zone];
  },

  /**
   * Get crowd level label
   * @param {number} density - Density value (0-1)
   * @returns {string} Label: "Low", "Medium", "High"
   */
  getCrowdLevel: (density) => {
    if (density < 0.4) return "Low";
    if (density < 0.7) return "Medium";
    return "High";
  },
};

export default routingService;
