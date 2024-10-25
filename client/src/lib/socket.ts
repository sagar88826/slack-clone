import { io } from "socket.io-client";

// "undefined" means the URL will be computed from the `window.location` object
const URL =
  import.meta.env.NODE_ENV === "production"
    ? undefined
    : "http://localhost:5000";

console.log("sagar");

export const socket = io(URL, {
  transports: ["websocket"],
  auth: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJhciIsImlhdCI6MTcyODk3NDgzMCwiZXhwIjoxNzI5NTc5NjMwfQ.6qRK5YGrBB5zofabQ093YdYf2IrVoOD2HSMD3OFxOE8",
  },
});
