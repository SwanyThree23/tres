/**
 * SwanyThree Tooltip — CSS-only tooltip with positioning.
 */

import type { ReactNode } from 'react';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: Position;
  className?: string;
}

const POSITION_CLASSES: Record<Position, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const ARROW_CLASSES: Record<Position, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-st3-panel border-x-transparent border-b-transparent border-4',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-st3-panel border-x-transparent border-t-transparent border-4',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-st3-panel border-y-transparent border-r-transparent border-4',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-st3-panel border-y-transparent border-l-transparent border-4',
};

export default function Tooltip({ children, content, position = 'top', className = '' }: TooltipProps) {
  return (
    <div className={`relative group inline-block ${className}`}>
      {children}
      <div
        className={`absolute ${POSITION_CLASSES[position]} z-50
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-150 pointer-events-none`}
      >
        <div className="bg-st3-panel text-st3-cream text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap border border-st3-burgundy/20">
          {content}
        </div>
        <div className={`absolute ${ARROW_CLASSES[position]}`} />
      </div>
    </div>
  );
}
