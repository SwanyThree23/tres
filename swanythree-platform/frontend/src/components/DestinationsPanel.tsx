/**
 * SwanyThree Destinations Panel — Per-guest RTMP management with Vault status.
 */

import { useState } from 'react';
import { Shield, Play, Square, AlertCircle, Loader2 } from 'lucide-react';
import type { FanoutStatus } from '@/types';

interface DestinationsPanelProps {
  destinations?: Record<string, FanoutStatus>;
  onStartPlatform?: (platform: string) => void;
  onStopPlatform?: (platform: string) => void;
  onAddKey?: (platform: string) => void;
}

const PLATFORMS = [
  { key: 'youtube', name: 'YouTube', color: 'text-red-500', bg: 'bg-red-500/10' },
  { key: 'twitch', name: 'Twitch', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { key: 'kick', name: 'Kick', color: 'text-green-400', bg: 'bg-green-400/10' },
  { key: 'tiktok', name: 'TikTok', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { key: 'facebook', name: 'Facebook', color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

const STATUS_DOTS: Record<string, string> = {
  live: 'bg-green-400',
  connecting: 'bg-yellow-400 animate-pulse',
  error: 'bg-red-400',
  stopped: 'bg-gray-500',
  idle: 'bg-gray-500',
};

export default function DestinationsPanel({ destinations = {}, onStartPlatform, onStopPlatform, onAddKey }: DestinationsPanelProps) {
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);

  const handleStart = async (platform: string) => {
    setLoadingPlatform(platform);
    onStartPlatform?.(platform);
    setTimeout(() => setLoadingPlatform(null), 2000);
  };

  const handleStop = async (platform: string) => {
    setLoadingPlatform(platform);
    onStopPlatform?.(platform);
    setTimeout(() => setLoadingPlatform(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-st3-cream/50 mb-2">
        <Shield className="w-4 h-4 text-green-400" />
        <span>All keys encrypted with AES-256-GCM</span>
      </div>

      {PLATFORMS.map(({ key, name, color, bg }) => {
        const dest = destinations[key];
        const status = dest?.status ?? 'idle';
        const isLive = status === 'live';
        const hasKey = !!dest;

        return (
          <div key={key} className={`flex items-center justify-between p-3 rounded-lg border border-st3-burgundy/20 ${bg}`}>
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOTS[status] ?? STATUS_DOTS.idle}`} />
              <span className={`text-sm font-medium ${color}`}>{name}</span>
              {hasKey && <Shield className="w-3 h-3 text-green-400" title="Key encrypted" />}
            </div>

            <div className="flex items-center gap-2">
              {!hasKey ? (
                <button onClick={() => onAddKey?.(key)} className="text-xs text-st3-gold hover:text-st3-gold-dim font-medium">
                  Add Key
                </button>
              ) : loadingPlatform === key ? (
                <Loader2 className="w-4 h-4 animate-spin text-st3-cream/50" />
              ) : isLive ? (
                <button
                  onClick={() => handleStop(key)}
                  className="p-1.5 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                  title="Stop streaming"
                >
                  <Square className="w-3 h-3" />
                </button>
              ) : status === 'error' ? (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <button onClick={() => handleStart(key)} className="text-xs text-st3-gold">
                    Retry
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStart(key)}
                  className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                  title="Start streaming"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
