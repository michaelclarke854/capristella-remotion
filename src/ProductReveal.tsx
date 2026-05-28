import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type ProductRevealProps = {
  imageUrl: string;
};

// CapriStella brand palette (capristella-ad-engine):
//   warm cream studio background:  #F4ECD9
//   gold accent (corso "amber"):   #C9A04B  (used as soft vignette only — no text)
// Hard rules: no text overlays, no jarring transitions, no off-brand colors.

const CREAM = '#F4ECD9';
const VIGNETTE_GOLD = 'rgba(201, 160, 75, 0.18)';

export const ProductReveal: React.FC<ProductRevealProps> = ({ imageUrl }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Smooth Ken Burns: zoom 1.00 → 1.12 across full duration.
  const scale = interpolate(frame, [0, durationInFrames - 1], [1.0, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Slow horizontal drift, very subtle.
  const translateX = interpolate(frame, [0, durationInFrames - 1], [-12, 12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Fade in (first 15 frames) and fade out (last 12 frames) for premium feel.
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 12, durationInFrames - 1],
    [0, 1, 1, 0.85],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: CREAM }}>
      <AbsoluteFill
        style={{
          opacity,
          transform: `translateX(${translateX}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            // Subtle drop shadow for the "premium studio" look — does not change the product.
            filter: 'drop-shadow(0 24px 60px rgba(0,0,0,0.22))',
          }}
        />
      </AbsoluteFill>
      {/* Warm vignette ring — on-brand gold tone, very low opacity. No text. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 60%, ${VIGNETTE_GOLD} 100%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
