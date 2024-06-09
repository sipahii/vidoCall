const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = {};

io.on("connection", (socket) => {
  // Send the user's ID when they connect
  socket.emit("me", socket.id);

  // Add user to online users
  socket.on("join", (name) => {
    onlineUsers[socket.id] = name;
    io.emit("updateUserList", onlineUsers);
  });

  // Remove user from online users on disconnect
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("updateUserList", onlineUsers);
    socket.broadcast.emit("callEnded");
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(2000, () => console.log("server is running on port 5000"));
