/**
 * SwanyThree Watch Party Bar — Cinema mode overlay with host controls.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, MonitorPlay } from 'lucide-react';
import { useWatchPartyStore } from '@/stores/watchPartyStore';
import { sendWatchPartyAction } from '@/services/socket';

interface WatchPartyBarProps {
  streamId?: string;
}

export default function WatchPartyBar({ streamId }: WatchPartyBarProps) {
  const { isActive, mediaUrl, isPlaying, isHost } = useWatchPartyStore();

  const handlePlayPause = () => {
    if (!streamId) return;
    sendWatchPartyAction(streamId, isPlaying ? 'pause' : 'play');
  };

  const handleClose = () => {
    if (!streamId) return;
    sendWatchPartyAction(streamId, 'pause');
    useWatchPartyStore.getState().deactivate();
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full bg-black rounded-xl overflow-hidden border border-st3-burgundy/30 relative"
        >
          {/* Badge */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="bg-st3-burgundy text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse flex items-center gap-1">
              <MonitorPlay className="w-3 h-3" /> WATCH PARTY
            </span>
          </div>

          {/* Video Area */}
          <div className="aspect-video bg-black flex items-center justify-center">
            {mediaUrl ? (
              <video src={mediaUrl} className="w-full h-full object-contain" autoPlay={isPlaying} />
            ) : (
              <p className="text-st3-cream/30 text-sm">No media loaded</p>
            )}
          </div>

          {/* Host Controls */}
          {isHost && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 bg-black/60 rounded-lg hover:bg-black/80 text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={handleClose}
                className="p-2 bg-black/60 rounded-lg hover:bg-red-600/80 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
