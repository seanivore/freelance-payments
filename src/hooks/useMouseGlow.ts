import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMouseGlowOptions {
  /** Color of the glow effect */
  color?: string;
  /** Base intensity (0-1) */
  intensity?: number;
  /** Blur radius in pixels */
  blurRadius?: number;
  /** Whether to disable on touch devices */
  disableOnTouch?: boolean;
  /** Intensity multiplier when near edges of target element */
  edgeIntensityMultiplier?: number;
}

interface GlowState {
  x: number;
  y: number;
  intensity: number;
  isActive: boolean;
}

export function useMouseGlow(options: UseMouseGlowOptions = {}) {
  const {
    color = 'rgba(201, 156, 173, 0.4)',
    intensity = 0.3,
    blurRadius = 60,
    disableOnTouch = true,
    edgeIntensityMultiplier = 2,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [glowState, setGlowState] = useState<GlowState>({
    x: 0,
    y: 0,
    intensity: intensity,
    isActive: false,
  });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  // Calculate intensity based on distance from element edges
  const calculateEdgeIntensity = useCallback(
    (x: number, y: number, rect: DOMRect): number => {
      // Calculate distance from center as percentage
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      
      const distanceFromCenter = Math.sqrt(
        Math.pow(relativeX - centerX, 2) + Math.pow(relativeY - centerY, 2)
      );
      const maxDistance = Math.sqrt(
        Math.pow(centerX, 2) + Math.pow(centerY, 2)
      );
      
      // Intensity increases as we move toward edges
      const edgeFactor = distanceFromCenter / maxDistance;
      return intensity * (1 + edgeFactor * (edgeIntensityMultiplier - 1));
    },
    [intensity, edgeIntensityMultiplier]
  );

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInside) {
        const newIntensity = calculateEdgeIntensity(e.clientX, e.clientY, rect);
        setGlowState({
          x: e.clientX,
          y: e.clientY,
          intensity: newIntensity,
          isActive: true,
        });
      } else {
        setGlowState(prev => ({
          ...prev,
          intensity: intensity * 0.5,
          isActive: false,
        }));
      }
    },
    [calculateEdgeIntensity, intensity]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setGlowState(prev => ({
      ...prev,
      intensity: intensity * 0.5,
      isActive: false,
    }));
  }, [intensity]);

  // Attach event listeners
  useEffect(() => {
    if (disableOnTouch && isTouchDevice) return;

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, disableOnTouch, isTouchDevice]);

  // CSS custom properties for the glow effect
  const glowStyles = {
    '--glow-x': `${glowState.x}px`,
    '--glow-y': `${glowState.y}px`,
    '--glow-intensity': glowState.intensity,
    '--glow-color': color,
    '--glow-blur': `${blurRadius}px`,
  } as React.CSSProperties;

  // Glow element component props
  const glowElementProps = {
    style: {
      position: 'fixed' as const,
      pointerEvents: 'none' as const,
      width: '400px',
      height: '400px',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      transform: 'translate(-50%, -50%)',
      left: glowState.x,
      top: glowState.y,
      opacity: glowState.intensity,
      filter: `blur(${blurRadius}px)`,
      transition: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1,
    },
  };

  return {
    containerRef,
    glowState,
    glowStyles,
    glowElementProps,
    handleMouseLeave,
    isDisabled: disableOnTouch && isTouchDevice,
  };
}
