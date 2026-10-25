export interface BudgetsliderProps {
  /**
   * Initial Budget
   * @default 3000
   */
  initialBudget?: number;
  /**
   * Accent — pass as `accentColor` not `accent`.
   * @default "#FF8055"
   */
  accentColor?: string;
  /**
   * Text — pass as `textColor` not `text`.
   * @default "#203D35"
   */
  textColor?: string;
  /**
   * Track — pass as `trackColor` not `track`.
   * @default "#E4E9DC"
   */
  trackColor?: string;
  /**
   * Font
   * @default {"fontSize":56,"variant":"Black","letterSpacing":"-0.02em","lineHeight":"1em","textAlign":"center"}
   */
  font?: string;
  /** Additional properties */
  [key: string]: unknown;
}
