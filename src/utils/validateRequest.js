const { validationResult } = require("express-validator");
const { setApiResponse } = require("./setApiResponse");

module.exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  console.log("result");
  if (!errors.isEmpty()) {
    return setApiResponse(
      400,
      false,
      null,
      errors
        .array()
        .map((err) => err.msg)
        .join(" || "),
      res
    );
  }
  next();
};
