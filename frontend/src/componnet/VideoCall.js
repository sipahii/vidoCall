// VideoCall.js
import React, { useRef, useEffect, useState } from "react";
import Peer from "simple-peer";
import socket from "../socket";

const VideoCall = ({ userToCall, onEndCall }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });

    socket.on("receiveCall", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
    });

    return () => {
      socket.off("receiveCall");
      socket.off("callAccepted");
    };
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signal: data,
        from: socket.id,
      });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    connectionRef.current = peer;
  };

  const acceptCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallAccepted(false);
    setReceivingCall(false);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    onEndCall();
  };

  useEffect(() => {
    if (userToCall) {
      callUser(userToCall);
    }
  }, [userToCall]);

  return (
    <div>
      <div>
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
      <div>
        {callAccepted && !receivingCall ? (
          <video
            playsInline
            ref={userVideo}
            autoPlay
            style={{ width: "300px" }}
          />
        ) : null}
      </div>
      <div>
        {receivingCall && !callAccepted ? (
          <div>
            <h1>{caller} is calling...</h1>
            <button onClick={acceptCall}>Accept</button>
          </div>
        ) : null}
      </div>
      <div>
        <button onClick={leaveCall}>End Call</button>
      </div>
    </div>
  );
};

export default VideoCall;
