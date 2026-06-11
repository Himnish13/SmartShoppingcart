const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

console.log("=== APP STARTING ===");
console.log("PORT env =", process.env.PORT);

const express = require("express");
const cors = require("cors");

const app = express();

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});

const initializeTables = require("./db/models");
const {
  clearImageCacheDir,
  getImageCacheDir,
} = require("./services/productImage.service");

try {
  initializeTables();
  console.log("Database initialized");
} catch (err) {
  console.error("Database initialization failed:", err);
}

try {
  clearImageCacheDir();
  console.log("Image cache cleared");
} catch (err) {
  console.error("Image cache clear failed:", err);
}

app.use(cors());

app.use(express.json());
app.use("/product-images", express.static(getImageCacheDir()));

const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/localCart.routes");
const shoppingListRoutes = require("./routes/shoppinglist.routes");
const routingRoutes = require("./routes/routing.routes");
const syncRoutes = require("./routes/sync.routes");
const recRoutes = require("./routes/recommendations.routes");
const positionRoutes = require("./routes/position.routes");
const offersRoutes = require("./routes/offers.routes");
const mobileRoutes = require("./routes/mobile.routes");
const mobileController = require("./controllers/mobile.controller");
const feedbackRoutes = require("./routes/feedback.routes");

app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/shopping-list", shoppingListRoutes);
app.use("/routing", routingRoutes);
app.use("/sync", syncRoutes);
app.use("/recommend", recRoutes);
app.use("/position", positionRoutes);
app.use("/offers", offersRoutes);
app.use("/mobile", mobileRoutes);
app.use("/feedback", feedbackRoutes);

app.get("/system/ip", mobileController.getLocalIp);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server Running",
  });
});

// Temporarily disable these for debugging
/*
const { startAutoSync } = require("./services/autoSync.service");
const mapService = require("./services/map.services");

mapService.loadNodes((err) => {
  if (err) {
    console.error("Node load error:", err);
  } else {
    console.log("✅ Nodes ready");
  }
});
*/

app.use((err, req, res, next) => {
  console.error("Express Error:", err);

  res.status(500).json({
    success: false,
    error: err.message,
  });
});

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});