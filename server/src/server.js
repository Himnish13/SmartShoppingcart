const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const app = require("./app");
require("./config/db");

const PORT = process.env.PORT || 3200;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});