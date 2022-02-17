import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Box,
  Slider, Stack
} from "@mui/material";
import { DisplayFlexContainer, GamesContainer } from "./Viewer.styles";
import { useSocketIO } from "../../utils/custom-hooks/useSocketIO";
import { getActiveChannelsApi } from "../../API/services/api.service";
import { VolumeDown, VolumeOff, VolumeUp } from '@mui/icons-material'

let gotOffer = false

const channelListItem = [
  { name: "Test", value: "test" },
  { name: "Dragon-Tiger", value: "dragon-tiger" },
  { name: "Sic-Bo", value: "sic-bo" },
];

let rtcPeerConnection = null
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ],
};

let peerVideo = null

const Viewer = () => {
  const [channelList, setChannelList] = useState(channelListItem);
  const [channel, setChannel] = useState('');
  const [flag, setFlag] = useState(false);
  const socket = useSocketIO()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [volume, setVolume] = useState(0)
  const [silent, setSilent] = useState(true)

  const fetchChannels = async () => {
    let res = await getActiveChannelsApi()
    console.log(res)
    setChannelList(res)
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const handleChange = (event) => {
    setChannel(event.target.value);
    window.channel = event.target.value
  };

  const submitChannelHandler = () => {
    navigate(`/viewers?roomName=${channel}`, { replace: true });
    console.log('1: join')
    socket.emit("join_room", channel);
  }

  useEffect(() => {
    console.log("refresh approach : ", socket);
    const roomName = new URLSearchParams(search).get("roomName");
    if (roomName) {
      setChannel(roomName);
    }
    if (roomName && socket) {
      console.log("1: join");
      socket.emit("join_room", roomName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const onIceCandidateFunction = useCallback((event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate, channel);
    }
  }, [channel, socket]);

  const OnTrackFunction = (event) => {
    peerVideo = document.getElementById("view-video");
    peerVideo.srcObject = event.streams[0];
    console.log(peerVideo, event.streams[0])
    peerVideo.onloadedmetadata = (e) => {
      peerVideo.play();
    };
  };

  // useEffect(() => {
  //   return () => {
  //     if(socket) {
  //       console.log('channel',channel)
  //       socket.emit("disconnect_call",channel)
  //       gotOffer = false
  //       setFlag(false)
  //       socket.disconnect()
  //     }
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // },[])

  useEffect(() => {
    if (socket && channel !== "") {
      window.socket = socket

      socket.on("room_not_exist", (roomName) => {
        if(channel === roomName) {
          console.log("testing count");
          const roomName = channelList.find((c) => c.value === channel)?.name;
          alert(`Room not exist with channel name : ${roomName} !!`);
        }
      });

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
        if (!gotOffer) {
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

      socket.on("disconnectBrodcaster", () => {
        setFlag(false)
        gotOffer = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onIceCandidateFunction, socket]);

  useEffect(() => {
    return () => {
      let socket = window.socket
      let channel = window.channel
      if (socket) {
        socket.emit("disconnect_call", channel, false)
        gotOffer = false
        setFlag(false)
        delete window.socket;
        delete window.channel;
      }
    }
  }, [])


  window.addEventListener("beforeunload", (ev) => {
    ev.preventDefault();
    let socket = window.socket
    let channel = window.channel
    if (socket) {
      return ev.returnValue = (() => {
        socket.emit("disconnect_call", channel, false)
        gotOffer = false
        setFlag(false)
      })();
    }
  });

  const handleVolumeChange = (e) => {
    let videoVolume = e.target.value
    if (peerVideo) {
      setSilent(false)
      peerVideo.volume = videoVolume;
      setVolume(videoVolume)
    }
  }

  const handleMute = (videoVolume) => {
    if (peerVideo) {
      setSilent(false)
      peerVideo.volume = videoVolume;
      setVolume(videoVolume)
    }
  }

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
          <InputLabel id="demo-simple-select-label">Select channel</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={channel}
            label="Select channel"
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
          disabled={!channel}
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
        autoPlay
        muted={silent}
      />
      <DisplayFlexContainer>
        <Button
          variant="contained"
          onClick={() => {
            socket.emit("disconnect_call", channel, false);
            fetchChannels();
            navigate('/viewers', { replace: true });
            gotOffer = false;
            setFlag(false);
          }}
        >
          close call
        </Button>

        <Box sx={{ width: 200, marginLeft: '2%' }}>
          <Stack spacing={2} direction='row' sx={{ mb: 1 }} alignItems='center'>
            {volume !== 0 ? <VolumeDown onClick={() => handleMute(0)} /> : <VolumeOff onClick={() => handleMute(0.2)} />}
            <Slider min={0} max={1} step={0.1} aria-label='Volume' value={volume} onChange={handleVolumeChange} />
            <VolumeUp />
          </Stack>
        </Box>
      </DisplayFlexContainer>
    </div>
  );
};

export default Viewer
