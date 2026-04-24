const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

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
// const { initPositionSystem } = require("./services/position.system");
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/shopping-list", shoppingListRoutes);
app.use("/routing", routingRoutes);
app.use("/sync", syncRoutes);
app.use("/recommend", recRoutes);
app.use("/position", positionRoutes);
app.use("/offers", offersRoutes);
app.use("/mobile", mobileRoutes);
app.get("/system/ip", mobileController.getLocalIp);


// initPositionSystem();
const PORT = 3500;
const HOST = "0.0.0.0"; // listen on all network interfaces (hotspot, LAN, etc.)
app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log(`Mobile page accessible at http://<device-hotspot-ip>:${PORT}/mobile`);
});