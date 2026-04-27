const model = require("../models/sync.model");

//FULL SYNC
async function fetchFullSync() {

  const products = await model.getAllProducts();
  const offers = await model.getAllOffers();
  const crowd = await model.getAllCrowd();
  const beacons = await model.getAllBeacons();
  const nodes = await model.getAllNodes();
  const edges = await model.getAllEdges();
  const categories = await model.getAllCategories();

  return {
    products,
    offers,
    crowd,
    beacons,
    nodes,
    edges,
    categories
  };
}

// INDIVIDUAL SYNC
async function fetchProductsSync() {
  const last = await model.getLastUpdatedTimeByTable("product_mastery");
  return await model.getProducts(last);
}
async function fetchOffersSync() {
  const last = await model.getLastUpdatedTimeByTable("offers");
  return await model.getOffers(last);
}
async function fetchCrowdSync() {
  const last = await model.getLastUpdatedTimeByTable("crowd_data");
  return await model.getCrowd(last);
}
async function fetchNodesSync() {
  const last = await model.getLastUpdatedTimeByTable("nodes");
  return await model.getNodesUpdated(last);
}
async function fetchEdgesSync() {
  const last = await model.getLastUpdatedTimeByTable("edges");
  return await model.getEdgesUpdated(last);
}
async function fetchCategoriesSync() {
  const last = await model.getLastUpdatedTimeByTable("category");
  return await model.getCategories(last);
}

module.exports = { 
  fetchFullSync,
  fetchProductsSync,
  fetchOffersSync,
  fetchCrowdSync,
  fetchNodesSync,
  fetchEdgesSync,
  fetchCategoriesSync
 };
