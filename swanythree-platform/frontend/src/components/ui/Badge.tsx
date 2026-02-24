/**
 * SwanyThree Badge — Rarity-colored badge/chip component.
 */

import type { ReactNode } from 'react';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type Variant = 'default' | 'outline' | 'status';

interface BadgeProps {
  children: ReactNode;
  rarity?: Rarity;
  variant?: Variant;
  className?: string;
}

const RARITY_STYLES: Record<Rarity, string> = {
  common: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  uncommon: 'bg-green-500/20 text-green-400 border-green-500/30',
  rare: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  epic: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  legendary: 'bg-st3-gold/20 text-st3-gold border-st3-gold/30',
};

const VARIANT_BASE: Record<Variant, string> = {
  default: 'border',
  outline: 'border-2 bg-transparent',
  status: 'border-0',
};

export default function Badge({ children, rarity = 'common', variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
        ${RARITY_STYLES[rarity]} ${VARIANT_BASE[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
