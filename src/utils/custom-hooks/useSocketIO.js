import socketio from 'socket.io-client'
import { SOCKET_URL } from '../../config'

export const useSocketIO = () => {
  console.log("client side socket hook chala")
  const socket = socketio.connect(SOCKET_URL)
  return socket
}

export const getSocketIO = () => {
  console.log("client side socket : function");
  const socket = socketio.connect(SOCKET_URL);
  return socket;
};