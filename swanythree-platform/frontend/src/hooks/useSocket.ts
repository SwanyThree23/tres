/**
 * SwanyThree Socket Hook — Socket.IO connection with auto-join.
 */

import { useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, joinStream, leaveStream, joinUserRoom } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';

interface UseSocketOptions {
  streamId?: string;
  autoJoinUserRoom?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { streamId, autoJoinUserRoom = true } = options;
  const { accessToken, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(connectSocket(accessToken ?? undefined));

  useEffect(() => {
    const socket = connectSocket(accessToken ?? undefined);
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      if (autoJoinUserRoom && isAuthenticated) {
        joinUserRoom();
      }
      if (streamId) {
        joinStream(streamId);
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      if (streamId) {
        leaveStream(streamId);
      }
    };
  }, [accessToken, streamId, isAuthenticated, autoJoinUserRoom]);

  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
