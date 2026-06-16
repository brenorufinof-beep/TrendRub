import { useMemo, useState } from "react";
import { Hash, Sparkles, TrendingUp, Search } from "lucide-react";
import { PostCard } from "../components/PostCard";
import { Card, Input } from "../components/ui/Primitives";
import { useDB } from "../lib/store";
import { trendingHashtags } from "../lib/seed";

export function ExplorePage() {
  const posts = useDB((s) => s.posts);
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = [...posts];
    if (tag) list = list.filter((p) => p.hashtags.some((h) => h.toLowerCase() === tag.toLowerCase()));
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter((p) => p.text_content.toLowerCase().includes(term) || p.hashtags.some((h) => h.includes(term)));
    }
    return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [posts, tag, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Sparkles className="text-[var(--accent)]" size={22} /> Explorar
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Trends, hashtags em alta e conteúdos novos da comunidade global.
        </p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] pointer-events-none" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nos posts e hashtags…" className="pl-10" />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-[var(--accent)]" />
          <h2 className="font-semibold text-sm">Trending hashtags</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {tag && (
            <button
              onClick={() => setTag(null)}
              className="text-xs px-3 py-1.5 rounded-full bg-[var(--bg-soft)] hover:bg-[var(--border)] transition"
            >
              ✕ limpar filtro
            </button>
          )}
          {trendingHashtags.map((t) => {
            const active = tag === t.tag;
            return (
              <button
                key={t.tag}
                onClick={() => setTag(active ? null : t.tag)}
                aria-pressed={active}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition inline-flex items-center gap-1 ${
                  active ? "bg-brand-gradient text-white" : "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text)]"
                }`}
              >
                <Hash size={11} />{t.tag.replace(/^#/, "")} <span className="opacity-60">· {t.count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-[var(--text-soft)]">Nada encontrado para esses filtros.</p>
        ) : (
          filtered.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </div>
    </div>
  );
}
