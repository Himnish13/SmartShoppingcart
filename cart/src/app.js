const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const express = require("express");
const app = express();
const cors = require("cors");
const initializeTables = require("./db/models");
const { clearImageCacheDir, getImageCacheDir } = require("./services/productImage.service");

initializeTables();
clearImageCacheDir();

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
const { startAutoSync } = require("./services/autoSync.service");
// const { initPositionSystem } = require("./services/position.system");
const mapService = require("./services/map.services");
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
mapService.loadNodes((err) => {

  if (err) console.error("Node load error");
  else console.log("✅ Nodes ready");

});

// initPositionSystem();
const PORT = Number(process.env.PORT || 3500);
const HOST = "0.0.0.0"; // listen on all network interfaces (hotspot, LAN, etc.)
app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log(`Mobile page accessible at http://<device-hotspot-ip>:${PORT}/mobile`);
    startAutoSync();
});
