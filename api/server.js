const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = require('./app');

const server = http.createServer(app);

/*
--------------------------------
SOCKET.IO SETUP
--------------------------------
*/

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://learn-mern-pied.vercel.app",
  "https://learn-mern-chinchalpetpavankumar-2177s-projects.vercel.app",
  "https://learn-mern-tjz5.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});


/*
--------------------------------
SOCKET CONNECTION
--------------------------------
*/

io.on("connection", (socket) => {

  console.log("🟢 User connected:", socket.id);

  /*
  Join quiz room
  */

  socket.on("join-quiz", (quizId) => {

    socket.join(quizId);

    console.log(`User ${socket.id} joined quiz ${quizId}`);

  });


  /*
  Submit answer
  */

  socket.on("submit-answer", (data) => {

    socket.to(data.quizId).emit("answer-submitted", data);

  });


  /*
  Disconnect
  */

  socket.on("disconnect", () => {

    console.log("🔴 User disconnected:", socket.id);

  });

});


/*
--------------------------------
START SERVER
--------------------------------
*/

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {

  console.log(`🚀 Server running on port ${PORT}`);

});