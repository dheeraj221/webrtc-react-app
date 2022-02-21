import React, { useCallback, useEffect, useState } from 'react'
import { Button, FormControl, InputLabel, MenuItem, Paper, Select, TextField } from '@mui/material';
import { GamesContainer } from './Broadcast.styles'
import { useSocketIO } from "../../utils/custom-hooks/useSocketIO";
// import { useMemo } from 'react';

let broadcastStream = null;
let rtcPeerConnection = {};
const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      url: "turn:numb.viagenie.ca",
      credential: "muazkh",
      username: "webrtc@live.com",
    },
    {
      url: "turn:192.158.29.39:3478?transport=udp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    },
    {
      url: "turn:192.158.29.39:3478?transport=tcp",
      credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
      username: "28224511:1379330808",
    }
  ],
};
const channelList = [
  { name: "Test", value: "test" },
  { name: "Dragon-Tiger", value: "dragon-tiger" },
  { name: "Sic-Bo", value: "sic-bo" },
];

let broadcastVideo;

export const Broadcast = () => {
  const [flag, setFlag] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0)
  const socket = useSocketIO()


  console.log('rtc', rtcPeerConnection)

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
  }, [channelCredentials.name, socket]);


  // capture user media streams
  const getUserMediaStream = () => {
    broadcastVideo = document.getElementById("broadcast-video");
    // const constraints = {
    //   audio: false,
    //   video: { width: 720, height: 480 },
    // };

    const constraints = {
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
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  useEffect(() => {
    if (socket) {
      window.socket = socket
      window.channel = channelCredentials.roomName

      socket.on("room_created", (roomName) => {
        if (channelCredentials.roomName === roomName) {
          setFlag(true);
          getUserMediaStream();
        }
      });

      socket.on("total_users_in_room", ({ roomName, totalActiveUsers }) => {
        console.log('got_totol', roomName, totalActiveUsers)
        if (channelCredentials.roomName === roomName) {
          setTotalUsers(totalActiveUsers);
        }
      });

      // Listening candidate event to exchange ICE Candidates
      socket.on("candidate", (candidate, id) => {
        console.log(' brodcast got condidate')
        let icecandidate = new RTCIceCandidate(candidate);
        rtcPeerConnection[id].addIceCandidate(icecandidate);
        console.log('candidate set', rtcPeerConnection)
      });

      // Listening room_ready_to_join event
      socket.on("ready", (roomName, id) => {
        console.log('3: ready', id)
        //Establishing peer connection using ICE Servers
        const peerConnections = new RTCPeerConnection(iceServers);
        rtcPeerConnection[id] = peerConnections
        console.log('RTC PEER', rtcPeerConnection, rtcPeerConnection[id], peerConnections)
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
      socket.on("answer", (answer, id) => {
        console.log('5: got answer')
        console.log('remote', answer, id)
        console.log('keys', Object.keys(rtcPeerConnection).includes(id))
        rtcPeerConnection[id].setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("disconnectViewer", (id) => {
        rtcPeerConnection[id].close();
        delete rtcPeerConnection[id];
      });

      socket.on("wrong_password", () => {
        alert("Wrong credentials, Please check channel-name and password again !!")
      })

      socket.on("broadcast_conflict", () => {
        alert("Room already in use !!")
      })
    }
  }, [channelCredentials.roomName, onIceCandidateFunction, socket]);

  useEffect(() => {
    return () => {
      let socket = window.socket
      let channel = window.channel
      if (socket) {
        socket.emit("disconnect_call", channel, true)
        setFlag(false)
        delete window.socket;
      }
      const tracks = broadcastVideo.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  }, [])

  window.addEventListener("beforeunload", (ev) => {
    ev.preventDefault();
    let socket = window.socket
    let channel = window.channel
    if (socket) {
      return ev.returnValue = (() => {
        socket.emit("disconnect_call", channel, true)
        setFlag(false)
      })();
    }
  });

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
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">
              Select channel
            </InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              sx={{ width: "280px", marginBottom: "20px" }}
              label="Select channel"
              onChange={(e) =>
                setChannelCredentials((prevState) => ({
                  ...prevState,
                  roomName: e.target.value,
                }))
              }
            >
              {channelList.map((channel) => (
                <MenuItem key={channel.name} value={channel.value}>
                  {channel.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* <Input
            sx={{ width: "280px", marginBottom: "20px" }}
            placeholder="Channel Name"
            onChange={(e) =>
              setChannelCredentials((prevState) => ({
                ...prevState,
                roomName: e.target.value,
              }))
            }
          /> */}
          <TextField
            sx={{ width: "280px", marginBottom: "20px" }}
            // placeholder="Password"
            id="outlined-basic"
            variant="outlined"
            label="Password"
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
            disabled={
              Object.values(channelCredentials).filter(Boolean).length !== 2
            }
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
          // filter: "brightness(1.5)",
        }}
        height={400}
        width={600}
        playsInline
        muted
        autoPlay
      />
      <Button
        sx={{ marginTop: "40px", width: "70px" }}
        variant="contained"
        onClick={() => {
          console.log("channel", channelCredentials.roomName);
          socket.emit("disconnect_call", channelCredentials.roomName, true);
          setFlag(false);
        }}
      >
        End Call
      </Button>
    </div>
  );
};
