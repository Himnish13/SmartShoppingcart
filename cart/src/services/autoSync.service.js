const axios = require("axios");
const syncService = require("./sync.service");

const SERVER_URL = process.env.SERVER_URL;
const SERVER_TO_CART_SYNC_MS = Number(process.env.SERVER_TO_CART_SYNC_MS || 60000);
const CART_TO_SERVER_SYNC_MS = Number(process.env.CART_TO_SERVER_SYNC_MS || 10000);

let pulling = false;
let pushing = false;
let lastPositionNode = null;

async function pullServerDataToCart() {
  if (pulling) return;
  pulling = true;

  try {
    console.log("SERVER_URL =", SERVER_URL);

    const response = await axios.get(`${SERVER_URL}/sync/full`);

    console.log(
      "SYNC RESPONSE =",
      JSON.stringify(response.data, null, 2)
    );

    console.log(
      "Auto server-to-cart sync:",
      response.data?.counts ||
      response.data?.message ||
      response.data
    );
  } catch (err) {
    console.log(
      "SYNC ERROR =",
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

    console.log("Auto cart-to-server sync:", {
      shoppingList:
        results.shoppingList.count ??
        results.shoppingList.warning,
      cartItems:
        results.cartItems.count ??
        results.cartItems.warning,
      feedback:
        results.feedback.count ??
        results.feedback.warning,
      position: results.position?.node_id || null,
    });
  } catch (err) {
    console.log(
      "Auto cart-to-server sync failed:",
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