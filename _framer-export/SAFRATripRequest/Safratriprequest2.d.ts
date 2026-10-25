export interface Safratriprequest2Props {
  /**
   * Destination — pass as `defaultDestination` not `destination`.
   * Options: "thailand" | "egypt" | "turkiye"
   * @default "thailand"
   */
  defaultDestination?: 'thailand' | 'egypt' | 'turkiye';
  /**
   * Mode — pass as `defaultMode` not `mode`.
   * Options: "trip" | "direct" | "visa"
   * @default "trip"
   */
  defaultMode?: 'trip' | 'direct' | 'visa';
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
   * Font
   * @default {"fontSize":16,"variant":"Regular","letterSpacing":"-0.01em","lineHeight":"1.35em"}
   */
  font?: string;
  /**
   * Visa Preview
   * Options: "Service" | "Form"
   * @default "Service"
   */
  visaPreview?: 'Service' | 'Form';
  /** Additional properties */
  [key: string]: unknown;
}
