/**
 * SwanyThree Chat Panel — Real-time chat with platform badges and moderation.
 */

import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import type { ChatMessage } from '@/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  streamId?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  native: 'text-st3-gold',
  youtube: 'text-red-500',
  twitch: 'text-purple-400',
  kick: 'text-green-400',
  tiktok: 'text-pink-400',
  discord: 'text-indigo-400',
  facebook: 'text-blue-500',
  x: 'text-gray-300',
  instagram: 'text-orange-400',
  telegram: 'text-sky-400',
};

export default function ChatPanel({ messages }: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-st3-cream/30">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-sm">No messages yet</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`text-sm px-1.5 py-0.5 rounded ${
              msg.type === 'tip'
                ? 'bg-st3-gold/10 border border-st3-gold/20'
                : msg.type === 'bot'
                  ? 'bg-purple-500/10 border border-purple-500/20'
                  : msg.type === 'system'
                    ? 'text-st3-cream/40 italic'
                    : ''
            }`}
          >
            {msg.platform !== 'native' && (
              <span className={`text-[10px] font-bold mr-1 ${PLATFORM_COLORS[msg.platform] ?? 'text-st3-cream/40'}`}>
                [{msg.platform.toUpperCase()}]
              </span>
            )}
            <span className={`font-semibold ${msg.type === 'bot' ? 'text-purple-400' : 'text-st3-gold'}`}>
              {msg.username}
            </span>{' '}
            <span className="text-st3-cream/80">{msg.content}</span>
            {msg.moderation_status !== 'clean' && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 ml-1" title="Flagged by AI moderation" />
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
