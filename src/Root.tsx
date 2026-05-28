import React from 'react';
import { Composition } from 'remotion';
import { ProductReveal, ProductRevealProps } from './ProductReveal';

// CapriStella listing video — 6s, vertical 9:16, no audio, no text overlays.
// Cream studio background, Ken Burns motion on the product image.
// Brand: warm premium studio look. Never break CapriStella visual identity.

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<typeof ProductReveal, ProductRevealProps>
        id="ProductReveal"
        component={ProductReveal}
        durationInFrames={180}   // 6 s @ 30 fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          imageUrl: 'file:///sessions/quirky-gifted-ride/mnt/outputs/capristella-remotion/source-images/test-product.png',
        }}
      />
    </>
  );
};
