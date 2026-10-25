import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-[380px]">
        <p className="text-center text-2xl font-black tracking-[0.06em]">SAFRA</p>
        <p className="mt-1 text-center text-sm font-bold opacity-70">Admin</p>
        <LoginForm next={next ?? "/admin"} />
        <p className="mt-5 text-center text-xs opacity-70">
          Accounts are created in the Supabase dashboard, then granted access with{" "}
          <code className="rounded bg-ink/5 px-1">private.add_admin()</code>.
        </p>
      </div>
    </main>
  );
}
