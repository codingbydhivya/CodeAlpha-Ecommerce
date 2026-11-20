const { validationResult } = require('express-validator');

// Returns 400 with the first validation message plus the full list.
module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ message: errors[0].message, errors });
};
