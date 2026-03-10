const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

// AUTH MIDDLEWARE


const auth = async (req, res, next) => {
  try {

    const token =
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing"
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: "Invalid or expired token"
      });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, email, role")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {

    console.error("Auth middleware error:", error);

    res.status(500).json({
      message: "Authentication failed"
    });

  }
};

// ADMIN AUTH


const adminAuth = async (req, res, next) => {

  auth(req, res, () => {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required"
      });
    }

    next();

  });

};

module.exports = {
  auth,
  adminAuth
};