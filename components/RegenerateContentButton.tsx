"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function RegenerateContentButton({ gameId }: { gameId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function regenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/content/regenerate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={regenerate} className="btn btn-secondary" disabled={loading}>
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Генерация..." : "Перегенерировать план"}
    </button>
  );
}
