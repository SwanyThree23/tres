/**
 * SwanyThree Embed Player — HLS player + embed code generator modal.
 */

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Maximize, Copy, Check, Code, Tv } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface EmbedPlayerProps {
  streamId: string;
  hlsUrl?: string;
}

export default function EmbedPlayer({ streamId, hlsUrl }: EmbedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return;

    const loadHls = async () => {
      const Hls = (await import('hls.js')).default;
      if (Hls.isSupported() && videoRef.current) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = hlsUrl;
      }
    };

    loadHls();
  }, [hlsUrl]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    videoRef.current?.requestFullscreen?.();
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://swanythree.com';

  return (
    <>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-contain" />

        {/* Live badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-dot" /> LIVE
          </span>
        </div>

        {/* Branding watermark */}
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <Tv className="w-3 h-3 text-st3-gold" />
          <span className="text-[10px] text-st3-gold font-bold">SwanyThree</span>
        </a>

        {/* Controls */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={toggleMute} className="p-1.5 bg-black/60 rounded hover:bg-black/80 text-white">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 bg-black/60 rounded hover:bg-black/80 text-white">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={() => setShowEmbed(true)} className="p-1.5 bg-black/60 rounded hover:bg-black/80 text-white">
            <Code className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embed Code Modal */}
      <EmbedCodeModal
        isOpen={showEmbed}
        onClose={() => setShowEmbed(false)}
        streamId={streamId}
        baseUrl={baseUrl}
      />
    </>
  );
}

// ── Embed Code Modal ────────────────────────────────────────────────

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamId: string;
  baseUrl: string;
}

function EmbedCodeModal({ isOpen, onClose, streamId, baseUrl }: EmbedCodeModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const embedUrl = `${baseUrl}/embed/${streamId}`;

  const codes = [
    {
      label: 'Standard Iframe',
      code: `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`,
    },
    {
      label: 'Responsive Iframe',
      code: `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe></div>`,
    },
    {
      label: 'Direct Link',
      code: embedUrl,
    },
    {
      label: 'OBS Browser Source',
      code: `URL: ${embedUrl}\nWidth: 1920\nHeight: 1080`,
    },
  ];

  const handleCopy = async (code: string, label: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Embed Player" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Preview */}
        <div className="aspect-video bg-black rounded-lg flex items-center justify-center border border-st3-burgundy/20">
          <div className="text-center text-st3-cream/30">
            <Tv className="w-8 h-8 mx-auto mb-1" />
            <p className="text-xs">Embed Preview</p>
          </div>
        </div>

        {/* Code Options */}
        {codes.map(({ label, code }) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <button
                onClick={() => handleCopy(code, label)}
                className="flex items-center gap-1 text-xs text-st3-gold hover:text-st3-gold-dim"
              >
                {copied === label ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <pre className="bg-st3-dark rounded-lg p-2 text-xs text-st3-cream/70 overflow-x-auto whitespace-pre-wrap break-all">
              {code}
            </pre>
          </div>
        ))}
      </div>
    </Modal>
  );
}
