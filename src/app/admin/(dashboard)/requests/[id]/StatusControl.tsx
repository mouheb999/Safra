"use client";

import { useState, useTransition } from "react";
import { NEXT_STATUS, STATUSES, STATUS_LABEL, type RequestStatus } from "@/lib/admin/format";
import { updateRequestStatus } from "../../../actions/requests";
import { Notice, adminPrimaryButton, adminSecondaryButton } from "../../../ui";

/** Primary "move to next stage" button plus every other status, with the server's error if any. */
export function StatusControl({ id, status }: { id: string; status: RequestStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = NEXT_STATUS[status];

  const move = (to: RequestStatus) =>
    startTransition(async () => {
      setError(null);
      const result = await updateRequestStatus(id, to);
      if (!result.ok) setError(result.error);
    });

  return (
    <div className="grid gap-3">
      {next ? (
        <button type="button" disabled={pending} onClick={() => move(next)} className={`${adminPrimaryButton} justify-self-start`}>
          {pending ? "Saving…" : `Mark as ${STATUS_LABEL[next].toLowerCase()} →`}
        </button>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="font-bold opacity-60">Set to:</span>
        {STATUSES.filter((s) => s !== status && s !== next).map((s) => (
          <button key={s} type="button" disabled={pending} onClick={() => move(s)} className={`${adminSecondaryButton} px-3 py-1`}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
