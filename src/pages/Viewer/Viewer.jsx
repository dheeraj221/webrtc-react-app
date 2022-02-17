import React, { useCallback, useEffect } from "react";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import { GamesContainer } from "./Viewer.styles";
import { getSocketIO } from "../../utils/custom-hooks/useSocketIO";

let gotOffer = false

const channelList = [
  { name: "Test", value: "test" },
  { name: "Dragon-Tiger", value: "dragon-tiger" },
  { name: "Sic-Bo", value: "sic-bo" },
];

let rtcPeerConnection = null
const iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const Viewer = () => {
  // const [activeChannels, setActiveChannels] = React.useState([]);
  const [channel, setChannel] = React.useState('');
  const [flag, setFlag] = React.useState(false);
  const socket = getSocketIO();

  const handleChange = (event) => {
    setChannel(event.target.value);
  };

  const submitChannelHandler = () => {
    console.log('1: join')
    socket.emit("join_room", channel);
  }

  const onIceCandidateFunction = useCallback ((event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate, channel);
    }
  },[channel, socket]);

  const OnTrackFunction = (event) => {
    const peerVideo = document.getElementById("view-video");
    peerVideo.srcObject = event.streams[0];
    console.log(peerVideo, event.streams[0])
    peerVideo.onloadedmetadata = (e) => {
      peerVideo.play();
    };
  };

  useEffect(() => {
    socket.on("room_joined", (roomName) => {
      if (channel === roomName && !flag) {
        console.log('2: joined')
        setFlag(true);
        socket.emit("ready", roomName);
      }
    });

    // Listening candidate event to exchange ICE Candidates
    socket.on("candidate", (candidate) => {
      console.log(' viewer got condidate')
      let icecandidate = new RTCIceCandidate(candidate);
      rtcPeerConnection.addIceCandidate(icecandidate);
    });

    // Listening offer event to create and set offer
    socket.on("offer", (offer) => {
      console.log('4: got offer')
      if(!gotOffer) {
      gotOffer = true
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = onIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      rtcPeerConnection
        .createAnswer()
        .then((answer) => {
          rtcPeerConnection.setLocalDescription(answer);
          socket.emit("answer", answer, channel);
        })
        .catch((error) => {
          console.log(error);
        });
      }
    });
  }, [channel, flag, onIceCandidateFunction, socket]);

  return !flag ? (
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
        <h1> View Stream </h1>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">channel</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={channel}
            label="Age"
            onChange={handleChange}
          >
            {channelList.map((channel) => (
              <MenuItem key={channel.name} value={channel.value}>
                {channel.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          sx={{ marginTop: "40px" }}
          variant="contained"
          onClick={submitChannelHandler}
        >
          Submit
        </Button>
      </GamesContainer>
    </Paper>
  ) : (
    <div style={{ display: "grid", margin: 30 }}>
      <h2 style={{ color: "green" }}>Watch Live Streaming</h2>
      <h3>Room Name : {channel}</h3>
      <video
        id="view-video"
        style={{
          border: "2px solid black",
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

export default Viewer;
