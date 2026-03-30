const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

app.use(helmet());
app.use(xss());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  })
);

const allowedOrigins = [
  env.FRONTEND_URL,
  'https://learn-mern-pied.vercel.app',
  'https://learn-mern-chinchalpetpavankumar-2177s-projects.vercel.app',
  'https://learn-mern-tjz5.onrender.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      console.log('CORS blocked:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    environment: env.NODE_ENV
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/practices', require('./routes/practiceRoutes'));

const supabase = require('./config/supabaseClient');
if (env.NODE_ENV !== 'test') {
  supabase
    .from('users')
    .select('id')
    .limit(1)
    .then(() => console.log('Supabase connected via Data API'))
    .catch((error) => console.error('Supabase connection failed:', error.message));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
