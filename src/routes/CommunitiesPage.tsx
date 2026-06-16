import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users2, Filter, Crown } from "lucide-react";
import { Badge, Button, Card, Tabs } from "../components/ui/Primitives";
import { useDB } from "../lib/store";
import { useAuth } from "../hooks/useAuth";
import { communitiesApi } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import type { CommunityStatus } from "../lib/types";

type ScopeTab = "all" | "mine" | "owned";

export function CommunitiesPage() {
  const { userId } = useAuth();
  const { notify } = useToast();
  const communities = useDB((s) => s.communities);
  const members = useDB((s) => s.members);
  const [scope, setScope] = useState<ScopeTab>("all");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => ["all", ...Array.from(new Set(communities.map((c) => c.category)))], [communities]);

  const visible = useMemo(() => {
    let list = communities;
    if (scope === "mine") list = list.filter((c) => members.some((m) => m.community_id === c.id && m.user_id === userId));
    if (scope === "owned") list = list.filter((c) => c.creator_id === userId);
    if (category !== "all") list = list.filter((c) => c.category === category);
    return list;
  }, [communities, members, scope, userId, category]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Users2 className="text-[var(--primary)]" /> Comunidades & Desafios
          </h1>
          <p className="text-sm text-[var(--text-muted)]">Encontre pessoas com os mesmos interesses ou crie a sua.</p>
        </div>
        <Link to="/communities/new">
          <Button variant="gradient"><Plus size={16} /> Nova comunidade</Button>
        </Link>
      </div>

      <Tabs<ScopeTab>
        active={scope}
        onChange={setScope}
        tabs={[
          { value: "all", label: "Todas", count: communities.length },
          { value: "mine", label: "Minhas", count: communities.filter((c) => members.some((m) => m.community_id === c.id && m.user_id === userId)).length },
          { value: "owned", label: "Criadas por mim", count: communities.filter((c) => c.creator_id === userId).length },
        ]}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-[var(--text-muted)]" />
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              category === c ? "bg-[var(--text)] text-[var(--bg)]" : "bg-[var(--bg-soft)] hover:bg-[var(--border)]"
            }`}
          >
            {c === "all" ? "Todas categorias" : c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-center py-12 text-[var(--text-soft)]">Nenhuma comunidade encontrada.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((c) => {
            const memberCount = members.filter((m) => m.community_id === c.id).length;
            const isMember = members.some((m) => m.community_id === c.id && m.user_id === userId);
            const isOwner = c.creator_id === userId;
            return (
              <Card key={c.id} className="overflow-hidden flex flex-col group hover:shadow-[var(--shadow-md)] transition">
                <Link to={`/community/${c.id}`} className="block">
                  <div className="h-28 relative" style={{ background: c.cover_url }}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <StatusBadge status={c.status} />
                      {isOwner && <Badge variant="warning"><Crown size={10} /> Dono</Badge>}
                    </div>
                  </div>
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Link to={`/community/${c.id}`} className="font-semibold hover:underline truncate">{c.title}</Link>
                    <Badge variant="violet">{c.category}</Badge>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">{c.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-[var(--text-soft)] flex items-center gap-1">
                      <Users2 size={12} /> {memberCount} membro{memberCount !== 1 && "s"}
                    </span>
                    <Button
                      size="sm"
                      variant={isMember ? "outline" : "primary"}
                      disabled={isOwner}
                      onClick={() => {
                        if (!userId || isOwner) return;
                        communitiesApi.toggleMembership(c.id, userId);
                        notify(isMember ? `Você saiu de ${c.title}` : `Bem-vindo a ${c.title}!`, isMember ? "info" : "success");
                      }}
                    >
                      {isOwner ? "Você é admin" : isMember ? "Participando" : "Participar"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: CommunityStatus }) {
  if (status === "active") return <Badge variant="success">ativa</Badge>;
  if (status === "pending") return <Badge variant="warning">pendente</Badge>;
  return <Badge variant="default">arquivada</Badge>;
}
