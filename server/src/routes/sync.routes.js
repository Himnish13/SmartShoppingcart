const express = require("express");
const router = express.Router();

const { getProducts, getMap } = require("../controllers/sync.controller");

router.get("/products", getProducts);
router.get("/map", getMap);

module.exports = router;