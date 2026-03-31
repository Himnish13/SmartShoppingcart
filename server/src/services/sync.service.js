const model = require("../models/sync.model");

//FULL SYNC
async function fetchFullSync() {

  // PRODUCTS
  const productTime = await model.getLastUpdatedTimeByTable("product_mastery");
  const products = await model.getProducts(productTime);

  // OFFERS
  const offerTime = await model.getLastUpdatedTimeByTable("offers");
  const offers = await model.getOffers(offerTime);

  // CROWD
  const crowdTime = await model.getLastUpdatedTimeByTable("crowd_data");
  const crowd = await model.getCrowd(crowdTime);

  // NODES
  const nodeTime = await model.getLastUpdatedTimeByTable("nodes");
  const nodes = await model.getNodesUpdated(nodeTime);

  // EDGES
  const edgeTime = await model.getLastUpdatedTimeByTable("edges");
  const edges = await model.getEdgesUpdated(edgeTime);

  // CATEGORIES
  const categoryTime = await model.getLastUpdatedTimeByTable("category");
  const categories = await model.getCategories(categoryTime);

  return {
    products,
    offers,
    crowd,
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