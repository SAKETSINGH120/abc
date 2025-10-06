const { body } = require("express-validator");

module.exports.userSignupValidator = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("number").trim().isString().isLength({ min: 10, max: 10 }).withMessage("invalid number "),
];

module.exports.userLoginValidator = [
  body("number").trim().isString().withMessage("number is required"),
  body("password").trim().isString().withMessage("passowrd is required"),
];
