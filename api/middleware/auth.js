const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

/*
--------------------------------
AUTH MIDDLEWARE
--------------------------------
*/

const auth = async (req, res, next) => {
  try {

    // Get token from cookie OR Authorization header
    const token =
      req.cookies?.token ||
      req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Not authorized - token missing'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }

    // Fetch user profile
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !userProfile) {
      return res.status(401).json({
        message: 'User not found'
      });
    }

    // Attach user to request
    req.user = {
      userId: userProfile.id,
      email: userProfile.email,
      ...userProfile
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

/*
--------------------------------
ADMIN AUTH
--------------------------------
*/

const adminAuth = async (req, res, next) => {

  await auth(req, res, async () => {

    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({
        message: 'Admin access required'
      });
    }

    next();

  });

};

module.exports = {
  auth,
  adminAuth
};