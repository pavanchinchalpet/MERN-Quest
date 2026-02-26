const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !userProfile) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = {
      userId: userProfile.id,
      email: userProfile.email,
      ...userProfile
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminAuth = async (req, res, next) => {
  auth(req, res, () => {
    if (!req.user.is_admin) {
      return res.status(403).json({ message: 'Admin only' });
    }
    next();
  });
};

module.exports = { auth, adminAuth };