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
// const { initPositionSystem } = require("./services/position.system");
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/shopping-list", shoppingListRoutes);
app.use("/routing", routingRoutes);
app.use("/sync", syncRoutes);
app.use("/recommend", recRoutes);
app.use("/position", positionRoutes);


// initPositionSystem();
const PORT = 3500;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});