const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
     
     socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message,userName);
    });
    
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnect', userId)
    });

  });
});

const port=process.env.PORT||3000;
server.listen(port,()=>console.log(`server is listening on ${port}`));
