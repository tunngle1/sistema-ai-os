"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X, Upload } from "lucide-react";

export function ContentApprovalActions({
  itemId,
  gameId,
  status,
}: {
  itemId: string;
  gameId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "approve" | "reject" | "publish") {
    setLoading(action);
    try {
      const res = await fetch(`/api/games/${gameId}/content/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Ошибка");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(null);
    }
  }

  if (status === "BLOCKED") {
    return <span className="text-xs text-[var(--danger)]">Заблокировано Product Guard</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {["HUMAN_REVIEW", "GENERATED", "DRAFT"].includes(status) && (
        <>
          <button
            type="button"
            className="btn btn-primary text-xs py-2 px-3"
            disabled={!!loading}
            onClick={() => act("approve")}
          >
            <Check className="w-3 h-3" />
            {loading === "approve" ? "..." : "Утвердить"}
          </button>
          <button
            type="button"
            className="btn btn-secondary text-xs py-2 px-3"
            disabled={!!loading}
            onClick={() => act("reject")}
          >
            <X className="w-3 h-3" />
            {loading === "reject" ? "..." : "На доработку"}
          </button>
        </>
      )}
      {["APPROVED", "SCHEDULED"].includes(status) && (
        <button
          type="button"
          className="btn btn-secondary text-xs py-2 px-3"
          disabled={!!loading}
          onClick={() => act("publish")}
        >
          <Upload className="w-3 h-3" />
          {loading === "publish" ? "..." : "Отметить опубликованным"}
        </button>
      )}
    </div>
  );
}
