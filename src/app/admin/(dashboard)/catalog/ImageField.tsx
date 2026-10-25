"use client";

import { useId, useRef, useState } from "react";
import { CATALOG_BUCKET, IMAGE_SOURCES_HINT } from "@/lib/images";
import { getBrowserClient } from "@/lib/supabase/browser";
import { adminInput, adminSecondaryButton } from "../../ui";

const MAX_BYTES = 5 * 1024 * 1024; // matches the bucket's file_size_limit
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/**
 * Image URL field with an "Upload" button. Uploads go straight from the browser to the public
 * `catalog` bucket (Storage policies allow admins only); the field then holds the public URL.
 */
export function ImageField({
  name,
  label,
  defaultValue = "",
  folder,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  /** Sub-folder in the bucket, e.g. "destinations". */
  folder: string;
  required?: boolean;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    const ext = TYPES[file.type];
    if (!ext) return setStatus({ tone: "error", text: "Use a JPEG, PNG, WebP or AVIF image." });
    if (file.size > MAX_BYTES) return setStatus({ tone: "error", text: "That image is over 5 MB — export a smaller version." });

    setUploading(true);
    setStatus({ tone: "info", text: "Uploading…" });
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const storage = getBrowserClient().storage.from(CATALOG_BUCKET);
    const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (error) {
      console.error("[admin] image upload failed", error);
      return setStatus({ tone: "error", text: "Upload failed — check you’re still signed in, then try again." });
    }
    setUrl(storage.getPublicUrl(path).data.publicUrl);
    setStatus({ tone: "info", text: "Uploaded. Save the form to use it on the site." });
  }

  return (
    <div className="grid gap-1.5 text-sm font-bold sm:col-span-2">
      <label htmlFor={id}>{label}</label>
      <div className="flex flex-wrap items-start gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-only preview of an arbitrary URL
          <img src={url} alt="" className="h-24 w-40 shrink-0 rounded-lg border border-ink/10 bg-white object-cover" />
        ) : (
          <div className="grid h-24 w-40 shrink-0 place-items-center rounded-lg border border-dashed border-ink/20 text-xs opacity-60">
            No image
          </div>
        )}
        <div className="grid min-w-[240px] flex-1 gap-2">
          <input
            id={id}
            name={name}
            type="url"
            required={required}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className={adminInput}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={`${adminSecondaryButton} px-3 py-1`}>
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={Object.keys(TYPES).join(",")}
              className="hidden"
              aria-label={`Upload ${label.toLowerCase()}`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <span className="text-xs font-semibold opacity-60">{IMAGE_SOURCES_HINT}. Max 5 MB.</span>
          </div>
          {status ? (
            <span role={status.tone === "error" ? "alert" : "status"} className={`text-xs font-bold ${status.tone === "error" ? "text-[#9A3412]" : "text-[#1E5631]"}`}>
              {status.text}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
