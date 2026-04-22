// ✅ Routing Service - Handles all routing-related API calls

const API_BASE = "http://localhost:3500";

const fetchJson = async (url, options) => {
  const res = await fetch(url, options);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText} for ${url}: ${text.slice(0, 200)}`
    );
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Expected JSON from ${url} but got: ${text.slice(0, 80)}`
    );
  }
};

export const routingService = {
  /**
   * Generate route for selected products
   * @param {number} startNode - Starting node ID (usually 1 for entrance)
   * @param {number[]} productIds - Array of product IDs to include in route
   * @returns {Promise} Route data with path and crowd info
   */
  generateRoute: async (startNode, productIds) => {
    try {
      const response = await fetchJson(`${API_BASE}/routing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
          productIds: productIds,
        }),
      });

      console.log("✅ Route generated:", response);
      return response;
    } catch (error) {
      console.error("❌ Routing Service Error:", error);
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
      const response = await fetchJson(`${API_BASE}/routing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
        }),
      });

      console.log("✅ Route for all items generated:", response);
      return response;
    } catch (error) {
      console.error("❌ Routing Service Error:", error);
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
      const response = await fetchJson(`${API_BASE}/routing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startNode: startNode,
          productId: productId,
        }),
      });

      console.log("✅ Single route generated:", response);
      return response;
    } catch (error) {
      console.error("❌ Routing Service Error:", error);
      throw error;
    }
  },

  /**
   * Fetch all nodes with coordinates
   * @returns {Promise} Object with nodes and their coordinates
   */
  fetchMapNodes: async () => {
    try {
      const response = await fetchJson(`${API_BASE}/routing/nodes`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch nodes:", error);
      // Return default map structure if fails
      return {};
    }
  },

  /**
   * Fetch store layout with aisles
   * @returns {Promise} Store layout data with aisles and bounds
   */
  fetchStoreLayout: async () => {
    try {
      const response = await fetchJson(`${API_BASE}/routing/store-layout`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch store layout:", error);
      return { aisles: [], bounds: { minX: 0, minY: 0, maxX: 10, maxY: 10 } };
    }
  },

  /**
   * Fetch current fused cart position (BLE+IMU)
   * @returns {Promise<{nodeId:number|null,x:number|null,y:number|null,heading:number,source:string}|null>}
   */
  fetchCurrentPosition: async () => {
    try {
      const response = await fetchJson(`${API_BASE}/position/current`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch current position:", error);
      return null;
    }
  },

  /**
   * Post BLE beacon reading to backend fusion
   */
  postBleReading: async (beaconId, rssi) => {
    const response = await fetchJson(`${API_BASE}/position/ble`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beaconId, rssi }),
    });
    return response;
  },

  /**
   * Post IMU update (absolute or delta) to backend fusion
   * Supports: {x,y,heading} and/or {dx,dy,dHeading}
   */
  postImuUpdate: async (payload) => {
    const response = await fetchJson(`${API_BASE}/position/imu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    return response;
  },

  /**
   * Fetch shopping progress
   * @returns {Promise} Shopping list progress data
   */
  fetchShoppingProgress: async () => {
    try {
      const response = await fetchJson(`${API_BASE}/shopping-list/progress`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch shopping progress:", error);
      return { totalItems: 0, completed: 0 };
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