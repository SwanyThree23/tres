/**
 * Fee Disclosure Modal
 * COMPLIANCE: Transparent fee structure display to eliminate false advertising.
 * Clearly differentiates platform transactions (10% fee) from direct tips (0% fee).
 */

import React, { useState, useEffect } from 'react';

interface FeeDisclosureProps {
  onClose: () => void;
}

interface FeeInfo {
  platformTransactions: string;
  directTips: string;
}

export default function FeeDisclosure({ onClose }: FeeDisclosureProps) {
  const [fees, setFees] = useState<FeeInfo | null>(null);

  useEffect(() => {
    fetch('/api/fees')
      .then((res) => res.json())
      .then(setFees)
      .catch(() =>
        setFees({
          platformTransactions:
            'Platform features (Paywalls, Subscriptions) carry a 10% service fee.',
          directTips:
            'Direct tips (CashApp, Zelle, Venmo) are fee-free and go directly to the creator.',
        })
      );
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-swany-panel rounded-2xl p-6 max-w-md w-full mx-4 border border-swany-gold/30">
        <h2 className="text-xl font-bold text-swany-gold mb-4">Fee Structure</h2>

        <div className="space-y-4">
          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-swany-cream mb-1">Platform Transactions</h3>
            <p className="text-xs text-gray-400">
              {fees?.platformTransactions || 'Loading...'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-swany-burgundy px-2 py-0.5 rounded">10% service fee</span>
              <span className="text-xs text-gray-500">Paywalls, Subscriptions</span>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-swany-cream mb-1">Direct Tips</h3>
            <p className="text-xs text-gray-400">
              {fees?.directTips || 'Loading...'}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-green-700 px-2 py-0.5 rounded">0% fee</span>
              <span className="text-xs text-gray-500">CashApp, Zelle, Venmo</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-500">
            Note: Direct tips are peer-to-peer and do not unlock gated content.
            Creators are solely responsible for reporting direct tip income for tax purposes.
            Platform transactions are reported via Stripe Connect (1099-K).
          </p>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-swany-gold text-black font-bold hover:bg-yellow-500 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
