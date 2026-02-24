import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
    type: string;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
}

interface UseWebSocketReturn {
    isConnected: boolean;
    lastMessage: WebSocketMessage | null;
    sendMessage: (msg: object) => void;
}

export function useWebSocket(onMessage?: (msg: WebSocketMessage) => void): UseWebSocketReturn {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const onMessageRef = useRef(onMessage);
    onMessageRef.current = onMessage;

    useEffect(() => {
        const token = localStorage.getItem('token') || 'demo-user-id';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws?token=${token}`;

        let socket: WebSocket;
        let reconnectTimer: ReturnType<typeof setTimeout>;
        let isMounted = true;

        const connect = () => {
            try {
                socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onopen = () => {
                    if (isMounted) setIsConnected(true);
                };

                socket.onmessage = (event) => {
                    try {
                        const data: WebSocketMessage = JSON.parse(event.data);
                        if (isMounted) {
                            setLastMessage(data);
                            onMessageRef.current?.(data);
                        }
                    } catch {
                        console.warn('[WS] Failed to parse message');
                    }
                };

                socket.onclose = () => {
                    if (isMounted) {
                        setIsConnected(false);
                        // Auto-reconnect after 5 seconds
                        reconnectTimer = setTimeout(connect, 5000);
                    }
                };

                socket.onerror = () => {
                    // Silent fail in dev when backend isn't running
                    setIsConnected(false);
                };
            } catch {
                // Browser blocks WS in some contexts
            }
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimer);
            socket?.close();
        };
    }, []);

    const sendMessage = useCallback((msg: object) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { isConnected, lastMessage, sendMessage };
}
