function normalizeImageUrl(req, imageUrl) {
  if (!imageUrl) {
    return imageUrl;
  }

  const localPathMatch = imageUrl.match(/\/product-images\/[^/?#]+$/);
  if (!localPathMatch) {
    return imageUrl;
  }

  const host = req.get("host");
  if (!host) {
    return imageUrl;
  }

  return `${req.protocol}://${host}${localPathMatch[0]}`;
}

function normalizeRowsImageUrls(req, rows) {
  return (rows || []).map((row) => ({
    ...row,
    image_url: normalizeImageUrl(req, row.image_url)
  }));
}

module.exports = {
  normalizeImageUrl,
  normalizeRowsImageUrls
};
