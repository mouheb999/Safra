// Who is looking at /admin? Verifies the session JWT and admin membership on the server.
// Pages use getSession(); server actions use requireAdmin() (actions are public endpoints).

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

export type Session =
  | { status: "signed-out" }
  | { status: "not-admin"; email: string }
  | { status: "admin"; supabase: SessionClient; userId: string; email: string };

export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { status: "signed-out" };

  const email = typeof claims.email === "string" ? claims.email : "";
  // RLS lets a user read their own admins row (and admins read all of them).
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", claims.sub).maybeSingle();
  if (!admin) return { status: "not-admin", email };
  return { status: "admin", supabase, userId: claims.sub, email };
});

export async function requireAdmin() {
  const session = await getSession();
  if (session.status === "signed-out") redirect("/admin/login");
  if (session.status === "not-admin") redirect("/admin");
  return session;
}
