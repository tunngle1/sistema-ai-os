import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

export function AppHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[rgba(10,10,15,0.8)] backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg">Система AI OS</div>
            <div className="text-xs text-[var(--muted)]">Маркетинговая операционная система</div>
          </div>
        </Link>
        <Link href="/games/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Создать игру
        </Link>
      </div>
    </header>
  );
}
