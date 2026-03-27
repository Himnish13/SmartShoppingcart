const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

// routes
app.use("/sync", require("./routes/sync.routes"));
app.use("/products", require("./routes/products.routes"));
app.use("/users", require("./routes/users.routes"));
app.use("/carts", require("./routes/carts.routes"));
app.use("/orders", require("./routes/orders.routes"));
app.use("/map", require("./routes/map.routes"));

module.exports = app;