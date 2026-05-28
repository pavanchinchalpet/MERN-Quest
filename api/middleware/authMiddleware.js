const jwt = require('jsonwebtoken');
const env = require('../config/env');
const supabase = require('../config/supabaseClient');
const { ACCESS_COOKIE_NAME } = require('../utils/generateToken');

const protect = async (req, res, next) => {
  let token;

  token = req.cookies[ACCESS_COOKIE_NAME];

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
      
      // Get user from the database
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

module.exports = protect;
