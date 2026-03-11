const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const supabase = require("../config/supabase");
const { sendOtpEmail } = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET;


// COOKIE CONFIG


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};


// TOKEN GENERATOR


const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

/*
--------------------------------
REGISTER
--------------------------------
*/

const register = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check existing user
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        username,
        email,
        avatar: "default",
        role: email.toLowerCase() === "pavanchinchalpet@gmail.com" ? "admin" : "user"
      })
      .select()
      .single();

    if (userError) {
      console.error(userError);
      return res.status(500).json({
        message: "Database error creating new user"
      });
    }

    // Store password
    const { error: loginError } = await supabase
      .from("auth_logins")
      .insert({
        user_id: user.id,
        method: "password",
        password_hash: passwordHash,
        is_verified: true
      });

    if (loginError) {
      console.error(loginError);
      return res.status(500).json({
        message: "Failed to create login record"
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (error) {

    console.error("Register error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// LOGIN


const login = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    // Dynamic Admin Check
    if (user.email.toLowerCase() === "pavanchinchalpet@gmail.com" && user.role !== "admin") {
      user.role = "admin";
      // Update db asynchronously
      supabase.from("users").update({ role: "admin" }).eq("id", user.id).then();
    }

    // Get password hash
    const { data: loginData } = await supabase
      .from("auth_logins")
      .select("*")
      .eq("user_id", user.id)
      .eq("method", "password")
      .single();

    if (!loginData) {
      return res.status(401).json({
        message: "Login method not found"
      });
    }

    const isMatch = await bcrypt.compare(password, loginData.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
};


// REQUEST OTP


const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find User
    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (!user) {
      // Return 200 anyway for security (don't reveal if email exists or not)
      return res.json({ message: "If an account exists, an OTP has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Upsert auth_logins strategy
    const { data: existingLogin } = await supabase
      .from("auth_logins")
      .select("id")
      .eq("user_id", user.id)
      .eq("method", "otp")
      .single();

    if (existingLogin) {
      await supabase
        .from("auth_logins")
        .update({
          otp_hash: otpHash,
          otp_expires_at: expiresAt.toISOString(),
          is_verified: false
        })
        .eq("id", existingLogin.id);
    } else {
      await supabase
        .from("auth_logins")
        .insert({
          user_id: user.id,
          method: "otp",
          otp_hash: otpHash,
          otp_expires_at: expiresAt.toISOString(),
          is_verified: false
        });
    }

    // Send email
    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.json({ message: "If an account exists, an OTP has been sent." });

  } catch (error) {
    console.error("Request OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// VERIFY OTP


const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Find User
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials or OTP expired" });
    }

    // Dynamic Admin Check
    if (user.email.toLowerCase() === "pavanchinchalpet@gmail.com" && user.role !== "admin") {
      user.role = "admin";
      // Update db asynchronously
      supabase.from("users").update({ role: "admin" }).eq("id", user.id).then();
    }

    // Find Auth record
    const { data: loginData } = await supabase
      .from("auth_logins")
      .select("*")
      .eq("user_id", user.id)
      .eq("method", "otp")
      .single();

    if (!loginData || !loginData.otp_hash) {
      return res.status(401).json({ message: "Invalid credentials or OTP expired" });
    }

    // Check expiration
    if (new Date(loginData.otp_expires_at) < new Date()) {
      return res.status(401).json({ message: "OTP has expired" });
    }

    // Check OTP
    const isMatch = await bcrypt.compare(otp, loginData.otp_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials or OTP expired" });
    }

    // Clear OTP hash and mark verified
    await supabase
      .from("auth_logins")
      .update({
        otp_hash: null,
        otp_expires_at: null,
        is_verified: true
      })
      .eq("id", loginData.id);

    const token = generateToken(user.id);

    res.cookie("token", token, cookieOptions);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// CURRENT USER


const getCurrentUser = async (req, res) => {
  try {

    const userId = req.user.id;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (user && user.email.toLowerCase() === "pavanchinchalpet@gmail.com" && user.role !== "admin") {
      user.role = "admin";
    }

    res.json({ user });

  } catch (error) {

    res.status(500).json({
      message: "Server error"
    });
  }
};

// LOGOUT


const logout = async (req, res) => {

  res.clearCookie("token");

  res.json({
    message: "Logout successful"
  });
};

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  getCurrentUser,
  logout
};