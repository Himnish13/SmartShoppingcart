const axios = require("axios");
const syncService = require("./sync.service");

const SERVER_URL = process.env.SERVER_URL;
const SERVER_TO_CART_SYNC_MS = Number(
  process.env.SERVER_TO_CART_SYNC_MS || 300000
); // 5 min

const CART_TO_SERVER_SYNC_MS = Number(
  process.env.CART_TO_SERVER_SYNC_MS || 60000
); // 1 min

let pulling = false;
let pushing = false;
let lastPositionNode = null;

async function pullServerDataToCart() {
  if (pulling) return;
  pulling = true;

  try {
    const response = await axios.get(`${SERVER_URL}/sync/full`);

    console.log("Server → Cart sync successful", {
      products: response.data?.products?.length || 0,
      offers: response.data?.offers?.length || 0,
      crowd: response.data?.crowd?.length || 0,
      nodes: response.data?.nodes?.length || 0,
      edges: response.data?.edges?.length || 0,
    });
  } catch (err) {
    console.error(
      "Server → Cart sync failed:",
      err.response?.data || err.message
    );
  } finally {
    pulling = false;
  }
}

async function pushCartDataToServer() {
  if (pushing) return;
  pushing = true;

  try {
    const results = {};

    try {
      results.shoppingList = await syncService.sendShoppingList();
    } catch (err) {
      results.shoppingList = {
        warning: err.response?.data || err.message,
      };
    }

    try {
      results.cartItems = await syncService.sendCurrentCartItems();
    } catch (err) {
      results.cartItems = {
        warning: err.response?.data || err.message,
      };
    }

    try {
      results.feedback = await syncService.sendFeedback();
    } catch (err) {
      results.feedback = {
        warning: err.response?.data || err.message,
      };
    }

    const nodeId = await syncService.getCurrentPositionNode();

    if (nodeId && nodeId !== lastPositionNode) {
      results.position = await syncService.sendPosition(nodeId);
      lastPositionNode = nodeId;
    }

    console.log("Cart → Server sync successful", {
      shoppingList:
        results.shoppingList.count ??
        results.shoppingList.warning ??
        0,

      cartItems:
        results.cartItems.count ??
        results.cartItems.warning ??
        0,

      feedback:
        results.feedback.count ??
        results.feedback.warning ??
        0,

      position: results.position?.node_id || null,
    });
  } catch (err) {
    console.error(
      "Cart → Server sync failed:",
      err.response?.data || err.message
    );
  } finally {
    pushing = false;
  }
}

function startAutoSync() {
  if (process.env.AUTO_SYNC_ENABLED === "false") {
    console.log("Auto sync disabled");
    return;
  }

  if (!SERVER_URL) {
    console.error("SERVER_URL is not configured");
    return;
  }

  setTimeout(pullServerDataToCart, 2000);
  setTimeout(pushCartDataToServer, 4000);

  setInterval(pullServerDataToCart, SERVER_TO_CART_SYNC_MS);
  setInterval(pushCartDataToServer, CART_TO_SERVER_SYNC_MS);

  console.log("Auto sync enabled", {
    serverUrl: SERVER_URL,
    serverToCartMs: SERVER_TO_CART_SYNC_MS,
    cartToServerMs: CART_TO_SERVER_SYNC_MS,
  });
}

module.exports = {
  startAutoSync,
  pullServerDataToCart,
  pushCartDataToServer,
};