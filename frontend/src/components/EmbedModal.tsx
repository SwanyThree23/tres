import React, { useState } from 'react';

interface EmbedModalProps {
  onClose: () => void;
}

export default function EmbedModal({ onClose }: EmbedModalProps) {
  const [copied, setCopied] = useState(false);

  const embedCode = `<iframe
  src="https://embed.swanythree.com/player/STREAM_ID"
  width="640"
  height="360"
  frameborder="0"
  allowfullscreen
  allow="autoplay; encrypted-media"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-swany-panel rounded-2xl p-6 max-w-lg w-full mx-4 border border-swany-gold/30">
        <h2 className="text-xl font-bold text-swany-gold mb-4">Embed Player</h2>
        <p className="text-sm text-gray-400 mb-4">
          Copy the code below to embed your SwanyThree stream on any website.
        </p>
        <pre className="bg-black/50 p-4 rounded-lg text-sm text-swany-cream overflow-x-auto mb-4">
          {embedCode}
        </pre>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-swany-gold text-black font-bold hover:bg-yellow-500 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
