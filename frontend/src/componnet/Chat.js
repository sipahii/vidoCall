// Chat.js
import React, { useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:2000");

const Chat = ({ userToChatWith }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = () => {
    socket.emit("sendMessage", { message, to: userToChatWith });
    setMessages([...messages, { from: "Me", text: message }]);
    setMessage("");
  };

  socket.on("receiveMessage", (message) => {
    setMessages([...messages, { from: "Other", text: message }]);
  });

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.from}: </strong>
            {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
