const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables FIRST
dotenv.config();

// Import Supabase
const supabase = require('./config/supabase');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "https://learn-mern-chinchalpetpavankumar-2177s-projects.vercel.app",
  "https://learn-mern-pied.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and 127.0.0.1 for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Supabase connection test
if (supabase) {
  supabase.from('users').select('count').limit(1)
    .then(() => console.log('✅ Connected to Supabase'))
    .catch(err => console.error('❌ Supabase connection error:', err.message));
} else {
  console.log('⚠️ Supabase not configured - running in fallback mode');
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-quiz', (quizId) => {
    socket.join(quizId);
    console.log(`User ${socket.id} joined quiz ${quizId}`);
  });
  
  socket.on('submit-answer', (data) => {
    socket.to(data.quizId).emit('answer-submitted', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
