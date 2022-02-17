import React, { useCallback, useEffect, useState } from 'react'
import { Button, Input, Paper } from '@mui/material';
import { GamesContainer } from './Broadcast.styles'
import { getSocketIO } from "../../utils/custom-hooks/useSocketIO";
// import { useMemo } from 'react';

let broadcastStream = null;
let rtcPeerConnection = {};
const iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

export const Broadcast = () => {
  const [flag, setFlag] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0)
  // const socket = useMemo(() => getSocketIO(), []);
  const socket = getSocketIO();

  console.log('rtc',rtcPeerConnection)

  const [channelCredentials, setChannelCredentials] = useState({
    roomName: "",
    password: "",
  });

  const onSubmitHandler = () => {
    if (channelCredentials.roomName && channelCredentials.password) {
      socket.emit("create_room", channelCredentials);
    }
  };

  const onIceCandidateFunction = useCallback((event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate, channelCredentials.name);
    }
  },[channelCredentials.name, socket]);


  // capture user media streams
  const getUserMediaStream = () => {
    const broadcastVideo = document.getElementById("broadcast-video");
    // const constraints = {
    //   audio: false,
    //   video: { width: 720, height: 480 },
    // };

   const constraints =  {
      video: {
          frameRate: 24,
          width: {
              min: 480, ideal: 720, max: 1280
          },
          aspectRatio: 1.33333
      },
      audio: true
  }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        /* use the stream */
        broadcastStream = stream;
        broadcastVideo.srcObject = stream;
        broadcastVideo.onloadedmetadata = function (e) {
          broadcastVideo.play();
        };
      })
      .catch((err) => {
        /* handle the error */
        console.log(err)
        alert("Couldn't Access User Media");
      });
  };

  useEffect(() => {
    socket.on("room_created", (roomName) => {
      if (channelCredentials.roomName === roomName) {
        setFlag(true);
        getUserMediaStream();
      }
    });

     socket.on("total_users_in_room", ({roomName, totalActiveUsers}) => {
       if (channelCredentials.roomName === roomName) {
         setTotalUsers(totalActiveUsers);
       }
     });

    // Listening candidate event to exchange ICE Candidates
    socket.on("candidate", (candidate,id) => {
      console.log(' brodcast got condidate')
      let icecandidate = new RTCIceCandidate(candidate);
      rtcPeerConnection[id].addIceCandidate(icecandidate);
      console.log('candidate set',rtcPeerConnection)
    });

    // Listening room_ready_to_join event
    socket.on("ready", (roomName,id) => {
      console.log('3: ready',id)
      //Establishing peer connection using ICE Servers
      const peerConnections = new RTCPeerConnection(iceServers);
      rtcPeerConnection[id] = peerConnections
      console.log('RTC PEER', rtcPeerConnection,rtcPeerConnection[id] , peerConnections)
      // Exchanging candidates by assigning function onIceCandidateFunction in rtcPeerConnection.onicecandidate interface
      // Runs onicecandidate everytime when it gets candidate from STUN server
      peerConnections.onicecandidate = onIceCandidateFunction;
      //To send out media stream to other peer side
      peerConnections.addTrack(
        broadcastStream.getTracks()[0],
        broadcastStream
      ); // 0 represent audio track
      peerConnections.addTrack(
        broadcastStream.getTracks()[1],
        broadcastStream
      ); // 1 represent video track
      // Now we need to create Offer (Offer contains info about session, transcoding and type of stream)
      peerConnections
        .createOffer()
        .then((offer) => {
          peerConnections.setLocalDescription(offer);
          socket.emit("offer", offer, channelCredentials.roomName);
          console.log('offer sent')
        })
        .catch((error) => {
          console.log(error);
        });
    });

    // Listening answer event to create and set answer
    socket.on("answer", (answer,id) => {
      console.log('5: got answer')
      console.log('remote',answer,id)
      console.log('keys',Object.keys(rtcPeerConnection).includes(id))
      rtcPeerConnection[id].setRemoteDescription(new RTCSessionDescription(answer));
    });
  }, [channelCredentials.roomName, onIceCandidateFunction, socket]);

  return !flag ? (
    <div>
      <Paper
        elevation={3}
        sx={{
          width: "500px",
          justifyContent: "center",
          margin: "40px auto",
          display: "flex",
        }}
      >
        <GamesContainer className="games-container">
          <h1> Broadcast Stream </h1>
          <Input
            sx={{ width: "280px", marginBottom: "20px" }}
            placeholder="Channel Name"
            onChange={(e) =>
              setChannelCredentials((prevState) => ({
                ...prevState,
                roomName: e.target.value,
              }))
            }
          />
          <Input
            sx={{ width: "280px", marginBottom: "20px" }}
            placeholder="Password"
            type="password"
            onChange={(e) =>
              setChannelCredentials((prevState) => ({
                ...prevState,
                password: e.target.value,
              }))
            }
          />
          <Button
            sx={{ marginTop: "20px" }}
            variant="contained"
            onClick={onSubmitHandler}
          >
            Submit
          </Button>
        </GamesContainer>
      </Paper>
    </div>
  ) : (
    <div style={{ display: "grid", margin: 30 }}>
      <h2 style={{ color: "red" }}>Live Streaming</h2>
      <h3 style={{ margin: 0 }}>
        Room Name :{" "}
        <span style={{ color: "green" }}>{channelCredentials.roomName}</span>
      </h3>
      <span>
        Total Viewers :{" "}
        <b style={{ color: "green", fontSize: 25 }}>{totalUsers - 1}</b>
      </span>
      <video
        id="broadcast-video"
        style={{
          marginTop: "10px",
          border: "10px solid grey",
          borderRadius: "20px",
          transform: "rotateY(180deg)",
          filter: "brightness(1.5)",
        }}
        height={400}
        width={600}
        playsInline
        muted
        autoPlay
      />
    </div>
  );
};
