"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { STATUSES } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/admin/session";

const input = z.object({ id: z.uuid(), status: z.enum(STATUSES as [string, ...string[]]) });

export type StatusResult = { ok: true } | { ok: false; error: string };

/** Moves a request along the pipeline. RLS (admins only) and the history trigger run in the database. */
export async function updateRequestStatus(id: string, status: string): Promise<StatusResult> {
  const { supabase } = await requireAdmin();
  const parsed = input.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "Unknown request or status." };

  const { data, error } = await supabase
    .from("requests")
    .update({ status: parsed.data.status as (typeof STATUSES)[number] })
    .eq("id", parsed.data.id)
    .select("id");
  if (error) {
    console.error("[admin] status update failed", error);
    return { ok: false, error: "Couldn’t save the status — try again." };
  }
  if (!data?.length) return { ok: false, error: "Request not found." };

  revalidatePath("/admin");
  revalidatePath(`/admin/requests/${parsed.data.id}`);
  return { ok: true };
}
