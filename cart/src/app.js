const express = require("express");
const app = express();

app.use(express.json());

const cartRoutes = require("./routes/localCart.routes");
const shoppingListRoutes = require("./routes/shoppinglist.routes");
const routingRoutes = require("./routes/routing.routes");
const syncRoutes = require("./routes/sync.routes");
app.use("/cart", cartRoutes);
app.use("/shopping-list", shoppingListRoutes);
app.use("/route", routingRoutes);
app.use("/sync", syncRoutes);
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
