const offerModel = require("../models/offer.model");

// Calculate offer status based on date window
function getOfferStatus(validFrom, validUntil) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(validFrom);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(validUntil);
  endDate.setHours(0, 0, 0, 0);

  if (today < startDate) {
    return 'scheduled';
  } else if (today > endDate) {
    return 'expired';
  } else {
    return 'active';
  }
}

// Check if offer is currently active (within date window)
function isOfferActive(validFrom, validUntil) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(validFrom);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(validUntil);
  endDate.setHours(0, 0, 0, 0);

  return today >= startDate && today <= endDate;
}

// Transform database format to frontend format
function transformOffer(dbOffer) {
  const status = getOfferStatus(dbOffer.valid_from, dbOffer.valid_until);

  return {
    id: `offer_${dbOffer.product_id}`,
    productId: dbOffer.product_id,
    title: `${dbOffer.discount_percent}% Off`,
    discountPct: dbOffer.discount_percent,
    startsAt: dbOffer.valid_from ? dbOffer.valid_from.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endsAt: dbOffer.valid_until ? dbOffer.valid_until.toISOString().split('T')[0] : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: status,
  };
}

// Validate offer dates
function validateOfferDates(validFrom, validUntil) {
  const start = new Date(validFrom);
  const end = new Date(validUntil);

  if (start >= end) {
    throw new Error('Start date must be before end date');
  }

  return true;
}

exports.getOffers = async () => {
  const offers = await offerModel.getOffers();
  // Only return offers that are currently active or scheduled (not expired)
  return offers
    .map(transformOffer)
    .filter(o => o.status !== 'expired');
};

exports.addOffer = (data) => {
  validateOfferDates(data.valid_from, data.valid_until);
  return offerModel.addOffer(data);
};

exports.updateOffer = (id, data) => {
  validateOfferDates(data.valid_from, data.valid_until);
  return offerModel.updateOffer(id, data);
};

exports.deleteOffer = (id) => offerModel.deleteOffer(id);