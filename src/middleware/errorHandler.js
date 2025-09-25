const { StatusCodes } = require("http-status-codes");

const errorHandler = (err, req, res, next) => {
  console.error(err); // full error in dev
  return res.status(err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
