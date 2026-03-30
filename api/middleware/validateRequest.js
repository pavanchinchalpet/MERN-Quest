const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new Error(`Validation Error: ${errorMessages}`);
  }
  next();
};

module.exports = validateRequest;
