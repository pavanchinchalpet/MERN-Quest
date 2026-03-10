const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

dotenv.config();

const supabase = require('./config/supabase');

const app = express();

// CORS CONFIG

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://learn-mern-pied.vercel.app",
  "https://learn-mern-chinchalpetpavankumar-2177s-projects.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(cors({
  origin: function (origin, callback) {

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));


// MIDDLEWARE


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// SUPABASE CONNECTION TEST


if (process.env.NODE_ENV !== "test") {

  supabase
    .from('users')
    .select('*')
    .limit(1)
    .then(() => {
      console.log('✅ Supabase connected');
    })
    .catch(err => {
      console.error('❌ Supabase connection failed:', err.message);
    });

}


// ROUTES


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));



// ERROR HANDLER


app.use((err, req, res, next) => {

  console.error("❌ Server Error:", err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });

});

module.exports = app;