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

module.exports = {
  fetchNodes,
  fetchEdges,
  fetchPOI
};