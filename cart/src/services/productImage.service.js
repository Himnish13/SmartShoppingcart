const fs = require("fs");
const path = require("path");
const axios = require("axios");

const CART_PORT = Number(process.env.PORT || 3500);
const PUBLIC_BASE_URL = process.env.CART_PUBLIC_BASE_URL || `http://localhost:${CART_PORT}`;
const IMAGE_CACHE_DIR = path.join(__dirname, "../../data/product-images");

function ensureImageCacheDir() {
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

function clearImageCacheDir() {
  fs.rmSync(IMAGE_CACHE_DIR, { recursive: true, force: true });
  ensureImageCacheDir();
}

function getImageCacheDir() {
  ensureImageCacheDir();
  return IMAGE_CACHE_DIR;
}

function getCachedProductImageFileName(productId) {
  ensureImageCacheDir();
  const prefix = `${productId}.`;
  const fileName = fs.readdirSync(IMAGE_CACHE_DIR).find((name) => name.startsWith(prefix));
  return fileName || null;
}

function getCachedProductImageUrl(productId) {
  const fileName = getCachedProductImageFileName(productId);
  if (!fileName) {
    return null;
  }

  return `${PUBLIC_BASE_URL}/product-images/${fileName}`;
}

function sanitizeExtension(extension) {
  if (!extension) return ".jpg";
  const normalized = extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  if (!/^\.[a-z0-9]+$/.test(normalized)) return ".jpg";
  return normalized;
}

function extensionFromContentType(contentType) {
  if (!contentType) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("svg")) return ".svg";
  return ".jpg";
}

function extensionFromUrl(imageUrl) {
  try {
    const pathname = new URL(imageUrl).pathname || "";
    const rawExtension = path.extname(pathname);
    return sanitizeExtension(rawExtension);
  } catch (err) {
    return ".jpg";
  }
}

async function downloadProductImage(product) {
  const remoteUrl = product.images || product.image_url;
  if (!remoteUrl) {
    return null;
  }

  ensureImageCacheDir();

  const cachedUrl = getCachedProductImageUrl(product.product_id);
  if (cachedUrl) {
    return cachedUrl;
  }

  const response = await axios.get(remoteUrl, {
    responseType: "arraybuffer",
    timeout: 15000
  });

  const contentType = response.headers["content-type"] || "";
  const extension = contentType ? extensionFromContentType(contentType) : extensionFromUrl(remoteUrl);
  const fileName = `${product.product_id}${extension}`;
  const filePath = path.join(IMAGE_CACHE_DIR, fileName);

  fs.writeFileSync(filePath, response.data);

  return `${PUBLIC_BASE_URL}/product-images/${fileName}`;
}

async function attachLocalImageUrls(products) {
  const updatedProducts = [];

  for (const product of products) {
    try {
      const localUrl = await downloadProductImage(product);
      updatedProducts.push({
        ...product,
        image_url: localUrl || null
      });
    } catch (err) {
      console.log(`Image download failed for product ${product.product_id}:`, err.message);
      updatedProducts.push({
        ...product,
        image_url: product.images || product.image_url || null
      });
    }
  }

  return updatedProducts;
}

module.exports = {
  attachLocalImageUrls,
  clearImageCacheDir,
  getImageCacheDir
};
