import React from 'react';
import { State } from '../types';

export function BrandedLayout({ state, children }: { state: State; children: React.ReactNode }) {
  const b = state.branding;
  const style: React.CSSProperties = {};

  if (b.background_type === 'solid') {
    style.background = b.background_value;
  }
  if (b.background_type === 'gradient') {
    style.background = b.background_value;
  }
  if (b.background_type === 'image' && b.background_image_url) {
    style.backgroundImage = `linear-gradient(rgba(255,255,255,${1 - b.background_opacity}),rgba(255,255,255,${1 - b.background_opacity})),url(${b.background_image_url})`;
  }

  return (
    <div className="branded" style={style}>
      {children}
    </div>
  );
}
