const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const cors = require("cors");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: "http://localhost:3000", // Allow frontend origin
    methods: ["GET", "POST"], // Allow these HTTP methods
    credentials: true, // Allow credentials like cookies (if needed)
  })
);

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:3000", // Allow Socket.io connections from frontend
    methods: ["GET", "POST"], // Allow these HTTP methods
    credentials: true, // Allow credentials
  },
});

const router = require("./router"); // Ensure your router is imported after CORS setup
const { error } = require("console");
app.use(router);

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected with ID:", socket.id);
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
    console.log(user);
    if (error) return callback({ error });

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });

    socket.broadcast.to(user.room).emit("message", {
      user: "admin",
      text: `${user.name} has joined!`,
    });

  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", { user: user.name, text: message });
    callback();
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
