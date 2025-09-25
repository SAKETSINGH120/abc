const express = require("express");
const errorHandler = require("./src/middleware/errorHandler");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const apiRoutes = require("./src/routes/index");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static("public"));

app.use("/api", apiRoutes);

app.use(errorHandler);

module.exports = app;
