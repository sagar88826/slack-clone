import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { socket } from "@/lib/socket";
import { plainToInstance } from "class-transformer";
import { ChevronDown, Hash, MessageSquare, Search, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import io, { Socket } from "socket.io-client";
import NameSpace from "../../../server/src/classes/namespace";

export function ChatInterface() {
  const [currentNamespace, setCurrentNamespace] = useState<string | undefined>(
    undefined
  );
  const [nsList, setNsList] = useState<NameSpace[]>();
  const [userCount, setUserCount] = useState(0);
  const [currentRoom, setCurrentRoom] = useState("Current Room");
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "rbunch",
      content: "I went running today.",
      time: "1:25 pm",
    },
    {
      id: 2,
      user: "rbunch",
      content: "I'm getting my tires changed this afternoon.",
      time: "2:25 pm",
    },
    { id: 3, user: "rbunch", content: "I like history.", time: "2:29 pm" },
    {
      id: 4,
      user: "rbunch",
      content: "What day is tomorrow?",
      time: "2:59 pm",
    },
  ]);

  const nsSocket: {
    [id: string]: Socket;
  } = useMemo(() => ({}), []);

  useEffect(() => {
    const listeners: {
      nsChange: {
        [id: string]: boolean;
      };
      messageToRoom: {
        [id: string]: boolean;
      };
    } = {
      nsChange: {},
      messageToRoom: {},
    };

    const onNsChange = (data: unknown) => {
      console.log("Namespace Changed", data);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onMessageToRoom = (messageObj: any) => {
      console.log(messageObj);
      setMessages((currentMessage) => [
        ...currentMessage,
        messageObj.newMessage,
      ]);
    };

    /**
     * addListeners job is to manage all listeners added to all namespaces.
     * this prevents listeners being added multiples time and make life
     * better for us as developers.
     */
    const addListeners = (id: string) => {
      if (!listeners.nsChange[id]) {
        listeners.nsChange[id] = true;
        console.log(listeners.nsChange[id]);

        if (!nsSocket[id]) throw new Error("Namespace socket does not exist");

        nsSocket[id].on("nsChange", onNsChange);
      }

      if (!listeners.messageToRoom[id]) {
        listeners.messageToRoom[id] = true;

        if (!nsSocket[id]) throw new Error("Namespace socket does not exist");

        nsSocket[id].on("messageToRoom", onMessageToRoom);
      }
    };

    const onNsList = (nsData: NameSpace[]) => {
      const nsDataProcessed = plainToInstance(NameSpace, nsData);

      nsDataProcessed.forEach((ns) => {
        if (!nsSocket[ns.id]) {
          // If the namespace socket does not exist, create a new one
          nsSocket[ns.id] = io(`http://localhost:8000${ns.endpoint}`);
        }
        addListeners(String(ns.id));
      });

      setNsList(nsDataProcessed);

      setCurrentNamespace(nsDataProcessed[0]?.endpoint);
    };

    socket.on("nsList", onNsList);

    socket.onAnyOutgoing((...args) => {
      console.log("outgoing", args);
    });

    socket.onAny((...args) => {
      console.log("incoming", args);
    });

    return () => {
      socket.off("nsList", onNsList);
      socket.offAny();
      socket.offAnyOutgoing();
      Object.keys(nsSocket).forEach((id) => {
        nsSocket[id]?.off("messageToRoom", onMessageToRoom);
        nsSocket[id]?.off("nsChange", onNsChange);
      });
    };
  }, [nsSocket]);

  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = () => {
    if (inputMessage.trim() !== "") {
      const newMessage = {
        id: messages.length + 1,
        user: "rbunch",
        content: inputMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // setMessages([...messages, newMessage]);
      const currentNs = nsList?.find((ns) => ns.endpoint === currentNamespace);

      if (currentNs) {
        const currentNsSocket = nsSocket[currentNs.id];
        if (currentNsSocket) {
          console.log("triggered", currentNsSocket);
          currentNsSocket.emit("newMessageToRoom", {
            newMessage,
            date: Date.now(),
            avatar: "https://via.placeholder.com/30",
            userName: "sagar88826",
          });
        }
      }
      setInputMessage("");
    }
  };

  return (
    <div className="flex h-screen bg-gray-800 text-gray-100">
      {/*create a navbar width 2rem only having 3 icons vertically */}
      <div className="w-16 py-4 bg-gray-800 gap-4 flex flex-col items-center">
        {nsList?.map((ns) => (
          <div
            onClick={() => setCurrentNamespace(ns.endpoint)}
            key={ns.name}
            className="p-2 rounded-lg flex justify-center items-center border border-white"
          >
            <img src={ns.image} alt={ns.name} className="w-6 h-6 mb-2" />
          </div>
        ))}
      </div>
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Rooms</h1>
          <ChevronDown className="w-5 h-5" />
        </div>
        <ul className="mb-6">
          {nsList
            ?.find((ns) => ns.endpoint === currentNamespace)
            ?.room.map((room) => (
              <li
                key={room.roomId}
                onClick={async () => {
                  const ackRes: { numUsers: number } = await nsSocket[
                    room.namespaceId
                  ]?.emitWithAck("joinRoom", room.roomTitle);
                  console.log(ackRes, nsSocket);
                  setUserCount(ackRes.numUsers);
                  setCurrentRoom(room.roomTitle);
                }}
                className="flex items-center mb-2"
              >
                <Hash className="w-4 h-4 mr-2" />
                {room.roomTitle}
              </li>
            ))}
        </ul>
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Direct Messages</h2>
          <ul>
            <li className="flex items-center mb-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              Main Room
            </li>
            <li className="flex items-center mb-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              Meeting Room
            </li>
          </ul>
        </div>
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex gap-2 justify-center items-center">
            <h2 className="text-xl font-semibold">{currentRoom}</h2>
            <div className="flex justify-center items-center">
              <span>{userCount ? userCount : ""}</span>
              <span>
                <User />
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            <Input
              type="text"
              placeholder="Search..."
              className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.map((message) => (
            <div key={message.id} className="mb-4">
              <div className="flex items-baseline">
                <span className="font-semibold mr-2">{message.user}</span>
                <span className="text-xs text-gray-400">{message.time}</span>
              </div>
              <p className="text-gray-300">{message.content}</p>
            </div>
          ))}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <Input
            type="text"
            placeholder="Enter your message"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            className="w-full bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
