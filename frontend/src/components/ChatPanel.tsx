import React, { useState, useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

interface ChatMessage {
  user: string;
  message: string;
  type?: 'bot' | 'user';
}

interface ChatPanelProps {
  socketRef: React.MutableRefObject<Socket | null>;
  roomId: string;
}

export default function ChatPanel({ socketRef, roomId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleChat = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on('chat', handleChat);
    return () => {
      socket.off('chat', handleChat);
    };
  }, [socketRef]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socketRef.current?.emit('chat-message', {
      roomId,
      user: 'You',
      message: input,
    });
    setInput('');
  };

  return (
    <div className="fixed right-0 top-0 w-80 h-full bg-swany-panel border-l border-swany-gold/30 flex flex-col z-40">
      <div className="p-3 border-b border-swany-gold/30">
        <h3 className="font-bold text-swany-gold">Live Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`text-sm ${msg.type === 'bot' ? 'text-swany-gold' : ''}`}>
            <span className="font-bold">{msg.user}: </span>
            <span>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-swany-gold/30 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 bg-black/30 text-swany-cream px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-swany-gold"
        />
        <button
          onClick={sendMessage}
          className="bg-swany-burgundy text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-[#a00028] transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
