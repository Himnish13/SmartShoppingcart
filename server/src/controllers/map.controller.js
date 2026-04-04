const mapService = require("../services/map.service");

const getNodes = async (req, res) => {
  try {
    const data = await mapService.fetchNodes();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch nodes" });
  }
};

const getEdges = async (req, res) => {
  try {
    const data = await mapService.fetchEdges();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch edges" });
  }
};

const getPOI = async (req, res) => {
  try {
    const data = await mapService.fetchPOI();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch POI" });
  }
};
async function uploadMap(req, res) {
  try {
    const { nodes, edges, categories } = req.body;

    await mapService.clearMap();
    await mapService.insertNodes(nodes);
    await mapService.insertEdges(edges);
    await mapService.insertCategories(categories);

    res.json({ message: "Map uploaded successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateNodes(req, res) {
  try {
    const nodes = req.body.nodes;
    await mapService.updateNodes(nodes);
    res.json({ message: "Nodes updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateEdges(req, res) {
  try {
    const edges = req.body.edges;
    await mapService.updateEdges(edges);
    res.json({ message: "Edges updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateCategoryMapping(req, res) {
  try {
    const categories = req.body.categories;
    await mapService.updateCategories(categories);
    res.json({ message: "Category mapping updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
module.exports = {
  getNodes,
  getEdges,
  getPOI,
  uploadMap,
  updateNodes,
  updateEdges,
  updateCategoryMapping
};