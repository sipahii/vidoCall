import React, { useEffect, useRef, useState } from "react";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import AssignmentIcon from "@material-ui/icons/Assignment";
import PhoneIcon from "@material-ui/icons/Phone";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("https://noodapp.vercel.app");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [onlineUsers, setOnlineUsers] = useState({});
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    // navigator.mediaDevices
    //   .getUserMedia({ video: true, audio: true })
    //   .then((stream) => {
    //     setStream(stream);
    //     myVideo.current.srcObject = stream;
    //   });

    // socket.on("me", (id) => {
    //   setMe(id);
    // });

    socket.on("updateUserList", (users) => {
      console.log("helloo", users);
      setOnlineUsers(users);
    });

    // Notify server about the new user
    // if (name) {
    //   socket.emit("join", name);
    // }
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.on("callEnded", () => {
      // Handle call ended event
      setCallEnded(true);
      if (connectionRef.current) {
        connectionRef.current.destroy(); // Destroy the peer connection
      }
      setStream(null); // Reset the stream state to null
    });

    return () => {
      socket.off("callEnded");
    };
  }, []);

  socket.on("me", (id) => {
    setMe(id);
  });

  const joinToCall = () => {
    socket.emit("join", name);
  };

  socket.on("callUser", (data) => {
    setReceivingCall(true);
    setCaller(data.from);
    setName(data.name);
    setCallerSignal(data.signal);
  });

  const callUser = (id) => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;

        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: stream,
        });

        peer.on("signal", (data) => {
          socket.emit("callUser", {
            userToCall: id,
            signalData: data,
            from: me,
            name: name,
          });
        });

        peer.on("stream", (stream) => {
          userVideo.current.srcObject = stream;
        });

        socket.on("callAccepted", (signal) => {
          setCallAccepted(true);
          peer.signal(signal);
        });

        connectionRef.current = peer;
      })
      .catch((error) => {
        console.error("Error accessing media devices: ", error);
      });
  };

  // const callUser = (id) => {
  //   navigator.mediaDevices
  //     .getUserMedia({ video: true, audio: true })
  //     .then((stream) => {
  //       setStream(stream);
  //       myVideo.current.srcObject = stream;
  //     });
  //   const peer = new Peer({
  //     initiator: true,
  //     trickle: false,
  //     stream: stream,
  //   });

  //   peer.on("signal", (data) => {
  //     socket.emit("callUser", {
  //       userToCall: id,
  //       signalData: data,
  //       from: me,
  //       name: name,
  //     });
  //   });

  //   peer.on("stream", (stream) => {
  //     userVideo.current.srcObject = stream;
  //   });

  //   socket.on("callAccepted", (signal) => {
  //     setCallAccepted(true);
  //     peer.signal(signal);
  //   });

  //   connectionRef.current = peer;
  // };

  // const answerCall = () => {
  //   navigator.mediaDevices
  //     .getUserMedia({ video: true, audio: true })
  //     .then((stream) => {
  //       setStream(stream);
  //       myVideo.current.srcObject = stream;
  //     });
  //   setCallAccepted(true);
  //   const peer = new Peer({
  //     initiator: false,
  //     trickle: false,
  //     stream: stream,
  //   });

  //   peer.on("signal", (data) => {
  //     socket.emit("answerCall", { signal: data, to: caller });
  //   });

  //   peer.on("stream", (stream) => {
  //     userVideo.current.srcObject = stream;
  //   });

  //   peer.signal(callerSignal);
  //   connectionRef.current = peer;
  // };
  const answerCall = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;

        setCallAccepted(true);
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: stream,
        });

        peer.on("signal", (data) => {
          socket.emit("answerCall", { signal: data, to: caller });
        });

        peer.on("stream", (stream) => {
          userVideo.current.srcObject = stream;
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
      })
      .catch((error) => {
        console.error("Error accessing media devices: ", error);
      });
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    setStream(null);
    socket.emit("callEnded");
  };

  return (
    <>
      <h1 style={{ textAlign: "center", color: "#fff" }}>Zoomish</h1>
      <div className="container">
        <div className="video-container">
          <div className="video">
            {stream && (
              <video
                playsInline
                muted
                ref={myVideo}
                autoPlay
                style={{ width: "300px" }}
              />
            )}
          </div>
          <div className="video">
            {callAccepted && !callEnded ? (
              <video
                playsInline
                ref={userVideo}
                autoPlay
                style={{ width: "300px" }}
              />
            ) : null}
          </div>
        </div>
        <div className="myId">
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={joinToCall}
              startIcon={<AssignmentIcon fontSize="large" />}
            >
              join
            </Button>
          </CopyToClipboard>
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <Button variant="contained" color="secondary" onClick={leaveCall}>
                End Call
              </Button>
            ) : null}
          </div>
        </div>
        <div className="online-users">
          <h2>Online Users</h2>
          <ul>
            {Object.keys(onlineUsers).map(
              (id) =>
                id !== me && (
                  <li key={id}>
                    {onlineUsers[id]}
                    <IconButton
                      color="primary"
                      aria-label="call"
                      onClick={() => callUser(id)}
                    >
                      <PhoneIcon fontSize="large" />
                    </IconButton>
                  </li>
                )
            )}
          </ul>
        </div>
        <div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h1>{name} is calling...</h1>
              <Button variant="contained" color="primary" onClick={answerCall}>
                Answer
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default App;
