export interface Safratripquiz3Props {
  /**
   * Preview — pass as `editorPreview` not `preview`.
   * Options: "Budget" | "When" | "Duration" | "Travelers" | "Vibe" | "Loading" | "Results"
   * @default "Budget"
   */
  editorPreview?: 'Budget' | 'When' | 'Duration' | 'Travelers' | 'Vibe' | 'Loading' | 'Results';
  /**
   * Initial Budget
   * @default 3000
   */
  initialBudget?: number;
  /**
   * Load Delay
   * Range: min: 600, max: 4000, step: 100
   * @default 1600
   */
  loadDelay?: number;
  /**
   * Cream — pass as `backgroundColor` not `cream`.
   * @default "#F8F4EA"
   */
  backgroundColor?: string;
  /**
   * Ink — pass as `textColor` not `ink`.
   * @default "#203D35"
   */
  textColor?: string;
  /**
   * Orange — pass as `accentColor` not `orange`.
   * @default "#FF8055"
   */
  accentColor?: string;
  /**
   * Accent 2 — pass as `secondaryAccent` not `accent2`.
   * @default "#317DA1"
   */
  secondaryAccent?: string;
  /**
   * Blue — pass as `softBlue` not `blue`.
   * @default "#DDEEF5"
   */
  softBlue?: string;
  /**
   * Font
   * @default {"fontSize":18,"variant":"Regular","letterSpacing":"-0.01em","lineHeight":"1.3em"}
   */
  font?: string;
  /**
   * Hero Image
   */
  heroImage?: string;
  /**
   * When Image
   */
  whenImage?: string;
  /**
   * Duration Image
   */
  durationImage?: string;
  /**
   * Travelers Image
   */
  travelersImage?: string;
  /**
   * Vibe Image
   */
  vibeImage?: string;
  /**
   * Trips — pass as `results` not `trips`.
   * @default [{"country":"Thailand","match":"94% MATCH","budget":"2,900 DT","duration":"7–9 days","tags":"Beach · Nightlife · Adventure","image":{"src":"https://images.unsplash.com/photo-1780168551093-7f3e0137b04f?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"Thailand coast"}},{"country":"Egypt","match":"88% MATCH","budget":"2,200 DT","duration":"6 days","tags":"Culture · City · Nature","image":{"src":"https://images.unsplash.com/photo-1771325676184-44d8035e3cd1?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"Egypt desert"}},{"country":"Türkiye","match":"90% MATCH","budget":"2,600 DT","duration":"5 days","tags":"Food · City · Luxury","image":{"src":"https://images.unsplash.com/photo-1631152282084-b8f1b380ccab?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85&w=800","alt":"Istanbul skyline"}}]
   */
  results?: unknown[];
  /** Additional properties */
  [key: string]: unknown;
}
