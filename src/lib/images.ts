// Where catalog images may come from. Shared by next.config.ts (next/image remotePatterns) and the
// catalog editor, so an admin can't save an image URL the public pages would refuse to render.

/** Images uploaded from /admin land in this Supabase Storage bucket. */
export const CATALOG_BUCKET = "catalog";
const UPLOAD_PATH = `/storage/v1/object/public/${CATALOG_BUCKET}/`;

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

/** Hosts allowed anywhere on the host (the original site's images). */
export const IMAGE_HOSTS = ["framerusercontent.com", "images.unsplash.com"] as const;

/** next/image remotePatterns: the hosts above + only the public catalog bucket on Supabase. */
export const imageRemotePatterns = [
  ...IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
  ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: `${UPLOAD_PATH}**` }] : []),
];

export const IMAGE_SOURCES_HINT = `Upload an image, or paste an https link on ${IMAGE_HOSTS.join(" or ")}`;

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if ((IMAGE_HOSTS as readonly string[]).includes(url.hostname)) return true;
    return url.hostname === supabaseHost && url.pathname.startsWith(UPLOAD_PATH);
  } catch {
    return false;
  }
}
