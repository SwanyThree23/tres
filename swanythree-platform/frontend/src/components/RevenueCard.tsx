/**
 * SwanyThree Revenue Card — 90/10 split visualization.
 */

import { DollarSign } from 'lucide-react';

interface RevenueCardProps {
  totalGross: number;
  platformFee: number;
  processorFee: number;
  netAmount: number;
}

export default function RevenueCard({ totalGross, platformFee, processorFee, netAmount }: RevenueCardProps) {
  const creatorPct = totalGross > 0 ? ((netAmount / totalGross) * 100).toFixed(0) : '87';
  const platformPct = totalGross > 0 ? ((platformFee / totalGross) * 100).toFixed(0) : '10';
  const processorPct = totalGross > 0 ? ((processorFee / totalGross) * 100).toFixed(0) : '3';

  return (
    <div className="card border-st3-gold/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h3 className="font-bold">Revenue</h3>
        </div>
        <span className="text-xs text-st3-cream/50 bg-st3-dark px-2 py-0.5 rounded">90/10 Split</span>
      </div>

      <p className="text-3xl font-black text-green-400 mb-3">${netAmount.toFixed(2)}</p>

      {/* Split Bar */}
      <div className="flex h-5 rounded-full overflow-hidden mb-2">
        <div
          className="bg-green-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
          style={{ width: `${creatorPct}%` }}
        >
          {Number(creatorPct) > 15 ? `${creatorPct}%` : ''}
        </div>
        <div
          className="bg-red-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
          style={{ width: `${platformPct}%` }}
        >
          {Number(platformPct) > 5 ? `${platformPct}%` : ''}
        </div>
        <div
          className="bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white transition-all"
          style={{ width: `${processorPct}%` }}
        >
          {Number(processorPct) > 5 ? `${processorPct}%` : ''}
        </div>
      </div>

      <div className="flex justify-between text-xs text-st3-cream/60">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Creator: ${netAmount.toFixed(2)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Platform: ${platformFee.toFixed(2)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Fees: ${processorFee.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
