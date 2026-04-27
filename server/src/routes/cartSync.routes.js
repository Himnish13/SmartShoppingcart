const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");

router.post("/shopping-list", cartController.receiveShoppingList);
router.post("/cart/items", cartController.receiveCurrentCartItems);
router.post("/cart/checkout", cartController.receiveCheckout);
router.post("/cart-position", cartController.receivePosition);

module.exports = router;
