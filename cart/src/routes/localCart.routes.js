const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cart.controller");

router.post("/add", cartController.addItem);
router.get("/items", cartController.getItems);
router.post("/remove", cartController.removeItem);
router.post("/clear", cartController.clearCart);

module.exports = router;