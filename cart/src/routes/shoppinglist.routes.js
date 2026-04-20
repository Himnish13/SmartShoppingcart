const express = require("express");
const router = express.Router();
const controller = require("../controllers/shoppinglist.controller");

router.post("/sync", controller.syncList);
router.post("/update", controller.updateQuantity);
router.post("/remove", controller.removeFromList);
router.post("/add", controller.addToList);
router.get("/items", controller.getList);
router.get("/categoryItems/:category_id", controller.getByCategory);
router.post("/clear", controller.clearList);
module.exports = router;