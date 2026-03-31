const express = require("express");
const router = express.Router();
const controller = require("../controllers/shoppinglist.controller");

router.post("/sync", controller.syncList);
router.get("/items", controller.getList);
router.post("/clear", controller.clearList);
module.exports = router;