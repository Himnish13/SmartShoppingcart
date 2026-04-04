const mapModel = require("../models/map.model");

const fetchNodes = async () => {
  return await mapModel.getNodes();
};

const fetchEdges = async () => {
  return await mapModel.getEdges();
};

const fetchPOI = async () => {
  return await mapModel.getPOI();
};
async function clearMap() {
  await mapModel.clearNodes();
  await mapModel.clearEdges();
  await mapModel.clearCategories();
}

function insertNodes(nodes) {
  return mapModel.insertNodes(nodes);
}

function insertEdges(edges) {
  return mapModel.insertEdges(edges);
}

function insertCategories(categories) {
  return mapModel.insertCategories(categories);
}

function updateNodes(nodes) {
  return mapModel.updateNodes(nodes);
}

function updateEdges(edges) {
  return mapModel.updateEdges(edges);
}

function updateCategories(categories) {
  return mapModel.updateCategories(categories);
}
module.exports = {
  fetchNodes,
  fetchEdges,
  fetchPOI,
  clearMap,
  insertNodes,
  insertEdges,
  insertCategories,
  updateNodes,
  updateEdges,
  updateCategories
};