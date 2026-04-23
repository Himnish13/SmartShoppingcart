const express = require("express");
const router = express.Router();

const offersController = require("../controllers/offers.controller");

router.get("/", offersController.getAllOffers);

module.exports = router;
