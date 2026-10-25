# Compass

Exported from Framer using Design to AI.

## Components

- `I9lejbgbo`
- `M0ybvw8zq`
- `Gh5hfcgil`
- `Wpyaoeylv`
- `Budgetslider`
- `I9lejbgbo2`
- `M0ybvw8zq2`
- `Gh5hfcgil2`
- `Wpyaoeylv2`
- `Budgetslider2`
- `I9lejbgbo3`
- `M0ybvw8zq3`
- `Gh5hfcgil3`
- `Wpyaoeylv3`
- `Budgetslider3`

## Installation

```bash
# Copy this folder to your project, then install dependencies:
npm install react react-dom framer-motion
```

## Usage

```tsx
import { I9lejbgbo } from './Compass';

function App() {
  return <I9lejbgbo />;
}
```

## Responsive Components

For components with responsive variants, use the responsive runtime:

```tsx
// Import the CSS for responsive breakpoints
import './Compass/_responsive-runtime.css';

// Option 1: Use the useBreakpoint hook
import { useBreakpoint } from './Compass/_responsive-runtime';

function App() {
  const breakpoint = useBreakpoint(); // 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  return <I9lejbgbo variant={breakpoint === 'base' ? 'mobile' : 'desktop'} />;
}

// Option 2: Use the WithBreakpoints HOC
import { WithBreakpoints } from './Compass/_responsive-runtime';

function App() {
  return (
    <WithBreakpoints
      Component={I9lejbgbo}
      variants={{
        base: 'mobile',    // 0px+
        md: 'tablet',      // 768px+
        lg: 'desktop'      // 1024px+
      }}
    />
  );
}
```

### Breakpoints

| Name | Min Width | Typical Use |
|------|-----------|-------------|
| base | 0px | Mobile |
| sm | 390px | Large mobile |
| md | 768px | Tablet |
| lg | 1024px | Laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Large desktop |

## Peer Dependencies

These components require the following packages in your project:

- `react` >= 18.0.0
- `react-dom` >= 18.0.0
- `framer-motion` >= 10.0.0

## Note

The Framer runtime is bundled as `_framer-runtime.js` - no external Framer dependency needed.
These exports are self-contained and work out of the box.

## Generated

Created with [Design to AI](https://designtoai.com)
