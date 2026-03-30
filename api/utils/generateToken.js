const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (res, userId, role) => {
  const payload = { userId, role };
  
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site, 'lax' for local
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

module.exports = generateToken;
