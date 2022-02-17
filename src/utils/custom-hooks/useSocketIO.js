import { useEffect, useRef } from 'react'
import socketio from 'socket.io-client'
import { SOCKET_URL } from '../../config'

export const useSocketIO = () => {
  let socket = useRef()
  useEffect(
    () => {
      socket.current = socketio.connect(SOCKET_URL)
    }, []
  )
  return socket.current
}