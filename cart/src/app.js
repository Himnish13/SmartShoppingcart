const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("OK");
});

const PORT = process.env.PORT || 3500;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});