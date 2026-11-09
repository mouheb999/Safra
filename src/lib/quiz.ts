// "Find my trip" questionnaire: the vibe vocabulary shared by the trip brain, packs and the admin.

export const VIBE_OPTIONS = [
  "Beach",
  "Islands",
  "Diving",
  "Nightlife",
  "Adventure",
  "Nature",
  "Food",
  "City",
  "Shopping",
  "Culture",
  "Relaxation",
  "Wellness",
  "Romance",
  "Luxury",
] as const;
export const MAX_VIBES = 5;

/** Vibes preselected when the questionnaire is opened from a category link (?category=experience). */
export function vibesForCategory(category: string): string[] {
  if (category === "experience" || category === "experiences") return ["Culture", "Food"];
  return [];
}
