import express from "express";
import { Server } from "socket.io";
import { namespaces } from "./data/namespace.js";
import chalk, { ChalkInstance } from "chalk";
import Room from "./classes/room.js";

const app = express();

const expressServer = app.listen(8000, () => {
  console.log("Server is running on port 8000");
});

const io = new Server(expressServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
    ],
  },
});
// manufactured way of building namespaces (without building the huge UI)
app.get("/change-ns", (req, res) => {
  namespaces[0]?.addRoom(new Room(0, "Deleted Article", 0));
  // And now let everyone know that the namespace has changed
  io.of(namespaces[0]!.endpoint).emit("nsChange", namespaces[0]);
  res.json(namespaces[0]);
});

io.use((socket, next) => {
  const jwt = socket.handshake.query.jwt;
  if (1) {
    next();
  } else {
    console.log("Goodbye");
    socket.disconnect();
  }
});

io.of("/").on("connection", (socket) => {
  // console.log("clientCount", io.engine.clientsCount, socket.id);
  console.log(
    chalk.blue(`1. A user ${socket.id} connected to the main namespace`)
  );
  // console.count(chalk.white.bgBlue("nsList emit"));
  socket.emit("nsList", namespaces);
});

const color = ["red", "green", "yellow", "magenta", "cyan", "white"];

namespaces.forEach((namespace, index) => {
  io.of(namespace.endpoint).on("connection", (socket) => {
    console.log(
      // @ts-ignore
      chalk[color[index]](
        `${index + 2}. A user ${socket.id} connected to the ${
          namespace.name
        } namespace ${io.engine.clientsCount}`
      )
    );
    socket.on(
      "joinRoom",
      async (
        roomTitle,
        ackCallback: (ackRes: { numUsers: number }) => void
      ) => {
        // need to fetch history of the room

        // leave all room (except own),because the client can only be in one room
        const rooms = socket.rooms;
        let i = 0;
        rooms.forEach((room) => {
          if (i !== 0) socket.leave(room);
          i++;
        });
        // need to join the room
        socket.join(roomTitle);
        const sockets = await io
          .of(namespace.endpoint)
          .in(roomTitle)
          .fetchSockets();
        const socketCount = sockets.length;
        ackCallback({
          numUsers: socketCount,
        });
      }
    );

    socket.on("newMessageToRoom", (messageObj) => {
      console.log(messageObj);
      // broadcast this to all connected clients... this room only!
      // but how can we know what room this socket is in?
      const room = socket.rooms;
      const currentRoom = [...room][1]!;
      // send out this messageObj to everyone including the sender
      io.of(namespace.endpoint)
        .in(currentRoom)
        .emit("messageToRoom", messageObj);
    });
  });
});

// NOTE: NOW THE NEXT TARGET IS TO UNDERSTAND ABOUT THE JOIN ROOM CONCEPT
