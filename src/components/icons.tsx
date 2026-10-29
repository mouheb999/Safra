// Icons ported from the Framer export (Compass, Sparkles, Globe, Plane vector set) plus the quiz's inline icons.

import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "stroke"> & { size?: number; color?: string; strokeWidth?: number };

function StrokeIcon({ size = 24, color = "currentColor", strokeWidth = 2, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/** The WhatsApp glyph (Simple Icons, CC0), filled. */
export function WhatsAppIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </StrokeIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </StrokeIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </StrokeIcon>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M16.24 7.76l-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265Z" />
      <circle cx="12" cy="12" r="10" />
    </StrokeIcon>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594Z" />
      <path d="M20 2v4M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </StrokeIcon>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
    </StrokeIcon>
  );
}

export function PlaneIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
    </StrokeIcon>
  );
}

/** The quiz's filled paper-plane mark. */
export function PaperPlaneIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill={color}
        d="M21.6 3.8a1 1 0 0 0-1-.2l-17 7a1 1 0 0 0 .1 1.9l6.7 1.8 1.8 6.7a1 1 0 0 0 .9.7h.1a1 1 0 0 0 .9-.6l7-17a1 1 0 0 0-.5-1.3Zm-8 14.1-1.2-4.6a1 1 0 0 0-.7-.7L7 11.4l11.2-4.6-4.6 11.1Z"
      />
    </svg>
  );
}

export function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg className="rtl:-scale-x-100" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 8h9" />
      <path d="m8.5 3.5 4 4.5-4 4.5" />
    </svg>
  );
}

const vibePaths: Record<string, string> = {
  Beach: "M3 14c2-1.8 4.3-2.8 7-2.8 2.7 0 5 1 7 2.8 1.2 1.1 2.4 2.5 3 4M4.5 18.5h15",
  Nightlife: "M6 14a6 6 0 1 0 8-8 7 7 0 1 1-8 8Z",
  Adventure: "M4 18 12 4l8 14H4Z",
  Nature: "M12 20c-4.5-2.5-6.5-6-6.5-9.5 3.8.3 6.2 1.8 6.5 4.6.3-2.8 2.7-4.3 6.5-4.6 0 3.5-2 7-6.5 9.5Z",
  Food: "M7 4v8m-2-8v8m4-8v8m6-8v6m0 0c2 0 2 3 0 3m0-3v9",
  City: "M4 20V9l5-3v14M11 20V5l5-2v17M18 20v-9l2-1v10",
  Culture: "M4 9h16M6 9v9m12-9v9M3 20h18M12 4l8 5H4l8-5Z",
  Luxury: "M12 4.2l2.5 5.1 5.7.8-4.1 4 .9 5.7-5-2.7-5 2.7.9-5.7-4.1-4 5.7-.8L12 4.2Z",
};

/** Icons for the quiz's "when", "duration" and "vibe" answers. */
export function OptionIcon({ kind, name }: { kind: "when" | "duration" | "vibe"; name: string }) {
  if (kind === "when") {
    return (
      <StrokeIcon strokeWidth={1.8}>
        <rect x="3.5" y="5.5" width="17" height="15" rx="3.2" />
        <path d="M3.5 10h17M8 3.8v3.4M16 3.8v3.4" />
      </StrokeIcon>
    );
  }
  if (kind === "duration") {
    return (
      <StrokeIcon strokeWidth={1.8}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.4 2" />
      </StrokeIcon>
    );
  }
  return (
    <StrokeIcon strokeWidth={1.8}>
      <path d={vibePaths[name] ?? "M4 12h16"} />
    </StrokeIcon>
  );
}

const travelerShapes: Record<string, { circles: [number, number, number][]; path: string }> = {
  "Just me": { circles: [[17, 10, 4]], path: "M8 28c1-5 4-8 9-8s8 3 9 8" },
  Couple: {
    circles: [[12, 10, 3.4], [22, 10, 3.4]],
    path: "M5 27c1-4.7 3.5-7 7-7 3 0 4.7 1.8 5 5 .3-3.2 2-5 5-5 3.5 0 6 2.3 7 7",
  },
  Friends: {
    circles: [[9, 11, 3], [17, 9, 3.4], [25, 11, 3]],
    path: "M4 27c1-4 3-6 6-6 2.5 0 4 1.3 4.8 4.1.8-2.8 2.3-4.1 4.8-4.1 3 0 5 2 6 6",
  },
  Family: {
    circles: [[11, 10.5, 3.2], [23, 10.5, 3.2], [17, 16, 2.8]],
    path: "M5 28c.8-4.5 3-6.8 6.5-6.8 2.4 0 3.9 1 5.5 3.4 1.6-2.4 3.1-3.4 5.5-3.4 3.5 0 5.7 2.3 6.5 6.8",
  },
};

export function TravelerIcon({ name }: { name: string }) {
  const shape = travelerShapes[name] ?? travelerShapes.Family;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      {shape.circles.map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
      ))}
      <path d={shape.path} />
    </svg>
  );
}
