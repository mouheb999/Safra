"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "../actions/auth";
import { adminInput, adminPrimaryButton } from "../ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null, email: "" });

  return (
    <form action={action} className="mt-6 grid gap-3 rounded-2xl border border-ink/12 bg-white p-5 shadow-sm">
      <input type="hidden" name="next" value={next} />
      <label className="grid gap-1.5 text-sm font-bold">
        Email
        <input name="email" type="email" required autoComplete="username" defaultValue={state.email} className={adminInput} />
      </label>
      <label className="grid gap-1.5 text-sm font-bold">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={adminInput} />
      </label>
      {state.error ? (
        <p role="alert" className="m-0 rounded-lg bg-[#FFF1EC] px-3 py-2 text-sm font-bold text-[#9A3412]">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${adminPrimaryButton} mt-1 w-full justify-center`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
