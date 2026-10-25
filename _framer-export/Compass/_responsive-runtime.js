/**
 * Responsive Runtime for Framer Exports
 *
 * Provides responsive breakpoint support for exported Framer components.
 *
 * Usage:
 * 1. Import the CSS: import './_responsive-runtime.css';
 * 2. Use the hook: const breakpoint = useBreakpoint();
 * 3. Or use WithBreakpoints HOC for responsive components
 */

import * as React from 'react';

// ============================================
// Breakpoint Configuration
// ============================================

export const defaultBreakpointSizes = {
  base: 0,
  sm: 390,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Breakpoints from highest to lowest for matching
const breakpointsDescending = ['2xl', 'xl', 'lg', 'md', 'sm', 'base'];

// ============================================
// Breakpoint Detection
// ============================================

/**
 * Get the current breakpoint name based on window width
 */
export function getBreakpointFromWidth(width) {
  for (const name of breakpointsDescending) {
    if (width >= defaultBreakpointSizes[name]) {
      return name;
    }
  }
  return 'base';
}

/**
 * Get current window width (SSR-safe)
 */
function getWindowWidth() {
  if (typeof window === 'undefined') return 1024; // Default to 'lg' for SSR
  return window.innerWidth;
}

// ============================================
// React Hook: useBreakpoint
// ============================================

/**
 * React hook that returns the current breakpoint name.
 * Updates automatically when the window is resized.
 *
 * @example
 * const breakpoint = useBreakpoint();
 * // breakpoint: 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export function useBreakpoint() {
  const { useSyncExternalStore } = React;

  const subscribe = (callback) => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  };

  const getSnapshot = () => getBreakpointFromWidth(getWindowWidth());
  const getServerSnapshot = () => 'lg'; // Default for SSR

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ============================================
// HOC: WithBreakpoints
// ============================================

/**
 * Fill missing breakpoints by inheriting from smaller breakpoints
 */
function fillBreakpoints(variants) {
  const breakpointOrder = ['base', 'sm', 'md', 'lg', 'xl', '2xl'];
  const filled = {};

  let lastVariant;
  for (const bp of breakpointOrder) {
    if (variants[bp] !== undefined) {
      lastVariant = variants[bp];
    }
    filled[bp] = lastVariant;
  }

  return filled;
}

/**
 * Higher-Order Component for responsive Framer components.
 * Renders different component variants based on viewport breakpoint.
 *
 * @example
 * <WithBreakpoints
 *   Component={HeroSection}
 *   variants={{
 *     base: 'mobileVariant',
 *     md: 'tabletVariant',
 *     lg: 'desktopVariant'
 *   }}
 *   title="Welcome"
 * />
 */
export function WithBreakpoints({ Component, variants: variantsMap, ...rest }) {
  const currentBreakpoint = useBreakpoint();

  // If no variants provided, just render the component
  if (!variantsMap || Object.keys(variantsMap).length === 0) {
    return React.createElement(Component, rest);
  }

  // Fill in missing breakpoints
  const filledVariants = fillBreakpoints(variantsMap);
  const currentVariant = filledVariants[currentBreakpoint];

  if (!currentVariant) {
    return React.createElement(Component, rest);
  }

  // Render with the appropriate variant
  return React.createElement(Component, {
    ...rest,
    variant: currentVariant,
    className: `pivot-responsive pivot-${currentBreakpoint} ${rest.className || ''}`.trim(),
  });
}

/**
 * Create a responsive wrapper component for a Framer component.
 * This creates a Component.Responsive pattern.
 *
 * @example
 * const HeroSection = createResponsiveComponent(OriginalHeroSection);
 * <HeroSection.Responsive variants={{ base: 'mobile', lg: 'desktop' }} />
 */
export function createResponsiveComponent(Component) {
  const ResponsiveWrapper = (props) => WithBreakpoints({ ...props, Component });
  Component.Responsive = ResponsiveWrapper;
  return Component;
}

export default {
  useBreakpoint,
  WithBreakpoints,
  createResponsiveComponent,
  getBreakpointFromWidth,
  defaultBreakpointSizes,
};
