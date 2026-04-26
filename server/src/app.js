const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});



app.use("/admin", require("./routes/admin.routes"));
app.use("/staff", require("./routes/staff.routes"));
app.use("/sync", require("./routes/sync.routes"));
app.use("/products", require("./routes/products.routes"));
app.use("/users", require("./routes/users.routes"));
app.use("/carts", require("./routes/carts.routes"));
app.use("/orders", require("./routes/orders.routes"));
app.use("/map", require("./routes/map.routes"));
app.use("/feedback", require("./routes/feedback.routes"));

module.exports = app;