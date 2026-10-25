export interface Safratripexperience3Props {
  /**
   * Destination
   * Options: "thailand" | "egypt" | "turkiye"
   * @default "thailand"
   */
  destination?: 'thailand' | 'egypt' | 'turkiye';
  /**
   * Cream
   * @default "#F8F4EA"
   */
  cream?: string;
  /**
   * Ink
   * @default "#203D35"
   */
  ink?: string;
  /**
   * Orange
   * @default "#FF8055"
   */
  orange?: string;
  /**
   * Hero Override — pass as `heroImageOverride` not `heroOverride`.
   */
  heroImageOverride?: string;
  /**
   * Font
   * @default {"fontSize":16,"variant":"Regular","letterSpacing":"-0.01em","lineHeight":"1.35em"}
   */
  font?: string;
  /** Additional properties */
  [key: string]: unknown;
}
