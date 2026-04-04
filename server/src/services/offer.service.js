const offerModel = require("../models/offer.model");

exports.addOffer = (data) => offerModel.addOffer(data);
exports.updateOffer = (id, data) => offerModel.updateOffer(id, data);
exports.deleteOffer = (id) => offerModel.deleteOffer(id);