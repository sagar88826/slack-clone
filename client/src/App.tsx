import "@/lib/socket";
import "./App.css";
import { socket } from "@/lib/socket";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected");

      socket.emit("join002", "002");

      socket.on("newMessage", (data) => {
        console.log("newMessage", data);
      });
    });
  }, []);

  return <></>;

  // return <ChatInterface />;
}

export default App;
