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

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

try {
  const productRoutes = require("./routes/product.routes");
  app.use("/products", productRoutes);
  console.log("✓ productRoutes loaded");
} catch (err) {
  console.error("✗ productRoutes failed:", err);
}

try {
  const cartRoutes = require("./routes/localCart.routes");
  app.use("/cart", cartRoutes);
  console.log("✓ cartRoutes loaded");
} catch (err) {
  console.error("✗ cartRoutes failed:", err);
}

try {
  const shoppingListRoutes = require("./routes/shoppinglist.routes");
  app.use("/shopping-list", shoppingListRoutes);
  console.log("✓ shoppingListRoutes loaded");
} catch (err) {
  console.error("✗ shoppingListRoutes failed:", err);
}

try {
  const routingRoutes = require("./routes/routing.routes");
  app.use("/routing", routingRoutes);
  console.log("✓ routingRoutes loaded");
} catch (err) {
  console.error("✗ routingRoutes failed:", err);
}

try {
  const syncRoutes = require("./routes/sync.routes");
  app.use("/sync", syncRoutes);
  console.log("✓ syncRoutes loaded");
} catch (err) {
  console.error("✗ syncRoutes failed:", err);
}

try {
  const recRoutes = require("./routes/recommendations.routes");
  app.use("/recommend", recRoutes);
  console.log("✓ recRoutes loaded");
} catch (err) {
  console.error("✗ recRoutes failed:", err);
}

try {
  const positionRoutes = require("./routes/position.routes");
  app.use("/position", positionRoutes);
  console.log("✓ positionRoutes loaded");
} catch (err) {
  console.error("✗ positionRoutes failed:", err);
}

try {
  const offersRoutes = require("./routes/offers.routes");
  app.use("/offers", offersRoutes);
  console.log("✓ offersRoutes loaded");
} catch (err) {
  console.error("✗ offersRoutes failed:", err);
}

try {
  const mobileRoutes = require("./routes/mobile.routes");
  app.use("/mobile", mobileRoutes);
  console.log("✓ mobileRoutes loaded");
} catch (err) {
  console.error("✗ mobileRoutes failed:", err);
}

try {
  const feedbackRoutes = require("./routes/feedback.routes");
  app.use("/feedback", feedbackRoutes);
  console.log("✓ feedbackRoutes loaded");
} catch (err) {
  console.error("✗ feedbackRoutes failed:", err);
}

try {
  const mobileController = require("./controllers/mobile.controller");
  app.get("/system/ip", mobileController.getLocalIp);
  console.log("✓ mobileController loaded");
} catch (err) {
  console.error("✗ mobileController failed:", err);
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server Running",
  });
});

try {
  const mapService = require("./services/map.services");

  mapService.loadNodes((err) => {
    if (err) {
      console.error("Node load error:", err);
    } else {
      console.log("✓ Nodes ready");
    }
  });
} catch (err) {
  console.error("✗ mapService failed:", err);
}

try {
  const { startAutoSync } = require("./services/autoSync.service");
  startAutoSync();
  console.log("✓ AutoSync started");
} catch (err) {
  console.error("✗ AutoSync failed:", err);
}

app.use((err, req, res, next) => {
  console.error("Express Error:", err);

  res.status(500).json({
    success: false,
    error: err.message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});