export interface Safrasafaricard2Props {
  /**
   * Safari — pass as `safariName` not `safari`.
   * @default "Kenya"
   */
  safariName?: string;
  /**
   * Description
   * @default "Explore iconic savannah landscapes and curated wildlife moments with SAFRA’s personal planning support."
   */
  description?: string;
  /**
   * Duration
   * @default "6–8 days"
   */
  duration?: string;
  /**
   * Highlights
   * @default "Masai Mara|Big Five experience|Optional Nairobi stay"
   */
  highlights?: string;
  /**
   * Image
   */
  image?: string;
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
   * Preview Form
   * @default false
   */
  previewForm?: boolean;
  /** Additional properties */
  [key: string]: unknown;
}
