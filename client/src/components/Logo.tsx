import React from 'react';

/**
 * The Northr mark: an N with a four-point star at its shoulder.
 *
 * Colour note — the tile is graphite and the mark sweeps white → accent blue.
 * The previous mark ran pale mist → moss → clay, which put three of the old
 * palette's colours into a 24px square and left the logo as the last warm
 * object on an otherwise cool page.
 *
 * Rounding is left to the caller. Call sites use `rounded-xs` in the rail and
 * `rounded-md` at hero size; nothing uses `rounded-full` any more.
 */
export const Logo = ({ className = "w-8 h-8", style }: { className?: string, style?: React.CSSProperties }) => (
  <div
    className={`relative flex items-center justify-center overflow-hidden shrink-0 ${className}`}
    style={{ backgroundColor: '#14181C', ...style }}
  >
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id="moss" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="28%" stopColor="#B6CFEA" />
          <stop offset="58%" stopColor="#4C86C4" />
          <stop offset="100%" stopColor="#2563A8" />
        </linearGradient>

        <linearGradient id="starGlowH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563A8" stopOpacity="0" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#2563A8" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="starGlowV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2563A8" stopOpacity="0" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#2563A8" stopOpacity="0" />
        </linearGradient>

        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        <filter id="glowStrong" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* The N */}
      <path d="
        M 24 24
        C 30 24, 31 27, 31 33
        V 67
        C 31 74, 27 75, 24 76
        V 77
        H 44
        V 76
        C 39 75, 34 74, 34 67
        V 35
        L 77 78
        V 52
        L 50 24
        Z
      " fill="url(#moss)" />
      
      {/* 4-Point Star Base */}
      <path d="
        M 70 12
        Q 70 31 52 31
        Q 70 31 70 50
        Q 70 31 88 31
        Q 70 31 70 12
        Z
      " fill="url(#moss)" filter="url(#glowStrong)" opacity="0.6" />
      
      {/* 4-Point Star Inner Brightness */}
      <path d="
        M 70 16
        Q 70 31 58 31
        Q 70 31 70 46
        Q 70 31 82 31
        Q 70 31 70 16
        Z
      " fill="#ffffff" filter="url(#glow)" />
      
      {/* Star Beams Horizontal */}
      <rect x="45" y="30.5" width="50" height="1" fill="url(#starGlowH)" filter="url(#glow)" />
      
      {/* Star Beams Vertical */}
      <rect x="69.5" y="6" width="1" height="50" fill="url(#starGlowV)" filter="url(#glow)" />
      
      {/* Intense Center */}
      <circle cx="70" cy="31" r="1.5" fill="#ffffff" filter="url(#glow)" />
    </svg>
  </div>
);
