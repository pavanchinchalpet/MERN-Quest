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

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
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