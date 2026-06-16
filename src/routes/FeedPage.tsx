import { useMemo, useState } from "react";
import { Globe, Users, UserCheck, Filter } from "lucide-react";
import { Composer } from "../components/Composer";
import { PostCard } from "../components/PostCard";
import { Tabs, EmptyState } from "../components/ui/Primitives";
import { selectFeed } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useDB } from "../lib/store";
import type { FeedFilter } from "../lib/types";

export function FeedPage() {
  const { userId } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>("global");

  // re-render when posts/likes/comments/follows/members change
  const posts = useDB((s) => s.posts);
  const _likes = useDB((s) => s.likes);
  const _comments = useDB((s) => s.comments);
  const _follows = useDB((s) => s.follows);
  const _members = useDB((s) => s.members);
  void _likes; void _comments; void _follows; void _members; void posts;

  const visible = useMemo(() => selectFeed(filter, userId), [filter, userId, posts.length]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Seu feed</h1>
        <p className="text-sm text-[var(--text-muted)]">
          O que tá pegando entre as pessoas e comunidades que você acompanha.
        </p>
      </div>

      <Composer />

      <Tabs<FeedFilter>
        active={filter}
        onChange={setFilter}
        tabs={[
          { value: "global", label: "Global", icon: <Globe size={14} /> },
          { value: "following", label: "Seguindo", icon: <UserCheck size={14} /> },
          { value: "communities", label: "Comunidades", icon: <Users size={14} /> },
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<Filter size={24} />}
          title="Sem posts por aqui"
          hint={
            filter === "following"
              ? "Siga mais pessoas para ver os posts delas no seu feed."
              : filter === "communities"
                ? "Entre em comunidades para ver o que tá rolando lá."
                : "Seja o primeiro a postar!"
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}
