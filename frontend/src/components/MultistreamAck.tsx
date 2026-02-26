/**
 * Multistreaming Compliance Acknowledgment Modal
 * COMPLIANCE: Users must confirm they are not violating platform exclusivity
 * agreements (e.g., Twitch Affiliate/Partner) before streaming to multiple destinations.
 */

import React, { useState } from 'react';

interface MultistreamAckProps {
  guestId: string;
  onAcknowledged: () => void;
  onCancel: () => void;
}

export default function MultistreamAck({ guestId, onAcknowledged, onCancel }: MultistreamAckProps) {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!checked) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/guest/stream/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId }),
      });

      if (res.ok) {
        onAcknowledged();
      }
    } catch (err) {
      console.error('Acknowledgment failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-swany-panel rounded-2xl p-6 max-w-md w-full mx-4 border border-swany-gold/30">
        <h2 className="text-xl font-bold text-swany-gold mb-2">Multistreaming Agreement</h2>
        <p className="text-sm text-gray-400 mb-4">
          Before streaming to multiple platforms, please review and acknowledge the following:
        </p>

        <div className="bg-black/30 p-4 rounded-lg mb-4 text-xs text-gray-300 space-y-2">
          <p>Some platforms (e.g., Twitch) have exclusivity agreements that restrict simultaneous streaming to other platforms.</p>
          <p><strong>Twitch Affiliates/Partners:</strong> May require 24-hour exclusivity for live content.</p>
          <p><strong>YouTube Partners:</strong> May have similar restrictions depending on your agreement.</p>
          <p>SwanyThree is not responsible for violations of your agreements with third-party platforms.</p>
        </div>

        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 accent-swany-gold"
          />
          <span className="text-xs text-gray-300">
            I confirm that streaming to multiple platforms simultaneously does not violate
            my agreements with those platforms (e.g., Twitch Affiliate/Partner exclusivity).
          </span>
        </label>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!checked || submitting}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              checked
                ? 'bg-swany-gold text-black hover:bg-yellow-500'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'I Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
}
