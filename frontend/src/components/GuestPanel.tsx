import React from 'react';

interface Guest {
  id: string;
  name: string;
  destinations?: Array<{ platform: string }>;
}

interface GuestPanelProps {
  guests: Guest[];
  expandedGuestId: string | null;
  onToggleExpand: (id: string) => void;
}

export default function GuestPanel({ guests, expandedGuestId, onToggleExpand }: GuestPanelProps) {
  const emptySlots = Math.max(0, 20 - guests.length);

  return (
    <div className="p-4">
      <div
        className={`grid gap-2 transition-all duration-500 ${
          expandedGuestId
            ? 'grid-cols-[3fr_1fr] grid-rows-[repeat(4,1fr)] h-[80vh]'
            : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5 h-auto'
        }`}
      >
        {guests.map((guest) => (
          <div
            key={guest.id}
            onClick={() => onToggleExpand(guest.id)}
            className={`
              relative bg-swany-panel rounded-xl overflow-hidden border-2 min-h-[120px]
              ${
                expandedGuestId === guest.id
                  ? 'border-swany-gold row-span-4 col-span-1 z-10'
                  : 'border-swany-burgundy/30 hover:border-swany-gold'
              }
              transition-all duration-300 cursor-pointer
            `}
          >
            {/* Video feed (WebRTC renders here) */}
            <video className="w-full h-full object-cover" autoPlay muted playsInline />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2 flex justify-between items-end">
              <span className="font-bold truncate">{guest.name}</span>

              {/* Individual Guest Destination Status */}
              {guest.destinations && guest.destinations.length > 0 && (
                <div className="flex gap-1">
                  {guest.destinations.map((d) => (
                    <span
                      key={d.platform}
                      className="text-[10px] bg-red-600 px-1 rounded"
                    >
                      {d.platform.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="bg-swany-panel/50 rounded-xl border-2 border-dashed border-swany-burgundy/20 flex items-center justify-center min-h-[120px]"
          >
            <span className="text-swany-burgundy text-sm">Waiting...</span>
          </div>
        ))}
      </div>
    </div>
  );
}
