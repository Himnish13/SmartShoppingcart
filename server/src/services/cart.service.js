const cartModel = require("../models/cartSession.model");

async function getActiveCarts() {
  return await cartModel.getActiveCartsFromDB();
}

module.exports = {
  getActiveCarts
};