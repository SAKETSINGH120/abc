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
app.use(
  cors({
    origin: "*", // Allow all origins, or specify specific origins
    credentials: false, // Set to false when using wildcard origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static("public"));

app.use("/api", apiRoutes);

app.use(errorHandler);

module.exports = app;
