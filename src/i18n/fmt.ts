// Tiny formatting helpers with no dictionaries attached, so client components can import them freely.

/** fmt("Hi {name}", { name: "Amira" }) → "Hi Amira". Unknown placeholders are left as is. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Label for a stored English option value (quiz answers, vibes, "beach" from a link…), falling back to the value. */
export function label<T extends Record<string, string>>(table: T, value: string): string {
  const entries = table as Record<string, string>;
  if (value in entries) return entries[value];
  const key = Object.keys(entries).find((k) => k.toLowerCase() === value.trim().toLowerCase());
  return key ? entries[key] : value;
}
