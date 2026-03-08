/**
 * SwanyThree Guest Panel — 20-slot expandable video grid.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Expand, Minimize2, Video, VideoOff, Mic, MicOff, Users } from 'lucide-react';
import type { StreamGuest } from '@/types';

interface GuestPanelProps {
  guests: StreamGuest[];
  expandedGuestId: string | null;
  onExpandGuest: (guestId: string | null) => void;
  onInviteGuest: () => void;
  maxGuests?: number;
}

export default function GuestPanel({ guests, expandedGuestId, onExpandGuest, onInviteGuest, maxGuests = 20 }: GuestPanelProps) {
  const getGridCols = (count: number) => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  const isExpanded = expandedGuestId !== null;
  const emptySlots = Math.max(0, Math.min(6, maxGuests - guests.length));

  return (
    <div className={`w-full ${isExpanded ? 'grid grid-cols-[1fr_3fr] gap-2' : ''}`}>
      {isExpanded && (
        <div className="space-y-1 overflow-y-auto max-h-[400px]">
          {guests
            .filter((g) => g.id !== expandedGuestId)
            .map((guest) => (
              <div
                key={guest.id}
                onClick={() => onExpandGuest(guest.id)}
                className="relative aspect-video bg-st3-dark rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-st3-gold/50"
              >
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-1">
                  <span className="text-xs text-st3-cream truncate">{guest.guest_name}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {isExpanded ? (
        <div className="relative aspect-video bg-st3-dark rounded-xl overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <button onClick={() => onExpandGuest(null)} className="p-1 bg-black/50 rounded-lg hover:bg-black/70">
              <Minimize2 className="w-4 h-4 text-st3-cream" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-3">
            <span className="text-sm font-medium text-st3-cream">
              {guests.find((g) => g.id === expandedGuestId)?.guest_name}
            </span>
          </div>
          <div className="w-full h-full flex items-center justify-center text-st3-cream/30">
            <Video className="w-12 h-12" />
          </div>
        </div>
      ) : (
        <div className={`grid ${getGridCols(guests.length + emptySlots)} gap-2`}>
          <AnimatePresence mode="popLayout">
            {guests.map((guest) => (
              <motion.div
                key={guest.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-video bg-st3-dark rounded-lg overflow-hidden group"
              >
                <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onExpandGuest(guest.id)} className="p-1 bg-black/50 rounded hover:bg-black/70">
                    <Expand className="w-3 h-3 text-st3-cream" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-st3-cream truncate">{guest.guest_name}</span>
                    <div className="flex gap-0.5">
                      {guest.has_video ? <Video className="w-3 h-3 text-green-400" /> : <VideoOff className="w-3 h-3 text-red-400" />}
                      {guest.has_audio && !guest.is_muted_by_host ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
                    </div>
                  </div>
                </div>
                <div className="w-full h-full flex items-center justify-center text-st3-cream/20">
                  <Users className="w-8 h-8" />
                </div>
              </motion.div>
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <motion.button
                key={`empty-${i}`}
                layout
                onClick={onInviteGuest}
                className="aspect-video border-2 border-dashed border-st3-burgundy/30 rounded-lg flex items-center justify-center
                  hover:border-st3-gold/50 hover:bg-st3-gold/5 transition-colors cursor-pointer"
              >
                <span className="text-xs text-st3-cream/30">+ Invite</span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
