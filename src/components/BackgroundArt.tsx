import React from 'react';

interface BackgroundArtProps {
  /** Which background art to use (1, 2, or 3) */
  artIndex?: 1 | 2 | 3;
  /** Opacity of the dark overlay (0-1) */
  overlayOpacity?: number;
  /** Custom gradient overlay */
  gradientOverlay?: string;
  /** Whether to use fixed positioning (default: true) */
  fixed?: boolean;
  /** Additional className */
  className?: string;
  /** Children to render on top */
  children?: React.ReactNode;
}

const ART_URLS = {
  1: '/assets/media/pdf-viewer-bg-art-1.webp',
  2: '/assets/media/pdf-viewer-bg-art-2.webp',
  3: '/assets/media/pdf-viewer-bg-art-3.webp',
};

export const BackgroundArt: React.FC<BackgroundArtProps> = ({
  artIndex = 1,
  overlayOpacity = 0.6,
  gradientOverlay,
  fixed = true,
  className = '',
  children,
}) => {
  const positionClass = fixed ? 'fixed' : 'absolute';
  
  // Default gradient: darker at edges, lighter in center
  const defaultGradient = `linear-gradient(
    to bottom,
    rgba(15, 15, 15, ${overlayOpacity}) 0%,
    rgba(15, 15, 15, ${overlayOpacity * 0.7}) 30%,
    rgba(15, 15, 15, ${overlayOpacity * 0.7}) 70%,
    rgba(15, 15, 15, ${overlayOpacity}) 100%
  )`;

  return (
    <div className={`${positionClass} inset-0 -z-10 overflow-hidden ${className}`}>
      {/* Background image - uses object-cover to fill without stretching */}
      <img
        src={ART_URLS[artIndex]}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      
      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: gradientOverlay || defaultGradient,
        }}
      />
      
      {/* Children rendered on top */}
      {children}
    </div>
  );
};

/**
 * PDF Viewer specific background with side margins
 * Creates the vignette effect shown in mockups
 */
interface PdfViewerBackgroundProps {
  artIndex?: 1 | 2 | 3;
  children?: React.ReactNode;
}

export const PdfViewerBackground: React.FC<PdfViewerBackgroundProps> = ({
  artIndex = 1,
  children,
}) => {
  return (
    <div className="relative w-full min-h-screen">
      {/* Background art layer */}
      <BackgroundArt
        artIndex={artIndex}
        overlayOpacity={0.4}
        fixed={false}
        className="absolute"
      />
      
      {/* Left margin overlay - darker gradient */}
      <div
        className="absolute inset-y-0 left-0 w-1/6 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to right, rgba(15, 15, 15, 0.85) 0%, transparent 100%)',
        }}
      />
      
      {/* Right margin overlay - darker gradient */}
      <div
        className="absolute inset-y-0 right-0 w-1/6 pointer-events-none z-0"
        style={{
          background: 'linear-gradient(to left, rgba(15, 15, 15, 0.85) 0%, transparent 100%)',
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default BackgroundArt;
