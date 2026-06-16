import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Crown, Users2, Pencil, Trash2, Shield, Calendar } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, Textarea } from "../components/ui/Primitives";
import { Composer } from "../components/Composer";
import { PostCard } from "../components/PostCard";
import { db, useDB, useDBMemo } from "../lib/store";
import { useAuth } from "../hooks/useAuth";
import { communitiesApi } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import type { Community } from "../lib/types";

export function CommunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { notify } = useToast();
  const community = useDB((s) => s.communities.find((c) => c.id === id));
  const members = useMemo(() => db.getState().members.filter((m) => m.community_id === id), [id]);
  const posts = useMemo(
    () => db.getState().posts.filter((p) => p.community_id === id).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [id]
  );
  const profiles = useDB((s) => s.profiles);
  const isMember = members.some((m) => m.user_id === userId);
  const isOwner = community?.creator_id === userId;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const memberProfiles = useMemo(
    () => members.map((m) => ({ ...m, profile: profiles.find((p) => p.id === m.user_id)! })).filter((m) => m.profile),
    [members, profiles]
  );

  if (!community) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Voltar</Button>
        <EmptyState icon={<Users2 />} title="Comunidade não encontrada" hint="Talvez ela tenha sido removida pelo criador." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Voltar</Button>

      <Card className="overflow-hidden">
        <div className="h-40 sm:h-52 relative" style={{ background: community.cover_url }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Badge variant={community.status === "active" ? "success" : community.status === "pending" ? "warning" : "default"}>
              {community.status}
            </Badge>
            <Badge variant="violet">{community.category}</Badge>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">{community.title}</h1>
              <p className="text-sm text-[var(--text-muted)] max-w-2xl">{community.description}</p>
            </div>
            <div className="flex gap-2">
              {isOwner ? (
                <>
                  <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil size={14} /> Editar</Button>
                  <Button variant="danger" onClick={() => setConfirmDel(true)}><Trash2 size={14} /> Excluir</Button>
                </>
              ) : (
                <Button
                  variant={isMember ? "outline" : "gradient"}
                  onClick={() => {
                    if (!userId) return;
                    communitiesApi.toggleMembership(community.id, userId);
                    notify(isMember ? "Você saiu da comunidade." : "Bem-vindo!", isMember ? "info" : "success");
                  }}
                >
                  {isMember ? "Sair" : "Participar"}
                </Button>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5"><Users2 size={14} /> {members.length} membros</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> criada em {new Date(community.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {isMember && <Composer defaultCommunityId={community.id} />}
          {posts.length === 0 ? (
            <EmptyState icon={<Users2 size={22} />} title="Nada por aqui ainda" hint="Seja o primeiro a postar nesta comunidade." />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Shield size={14} /> Regras</h3>
            <p className="text-sm text-[var(--text-muted)] whitespace-pre-line">{community.rules || "—"}</p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Users2 size={14} /> Membros ({members.length})</h3>
            <ul className="space-y-2.5 max-h-96 overflow-auto">
              {memberProfiles.map((m) => (
                <li key={m.user_id} className="flex items-center gap-2.5">
                  <Link to={`/profile/${m.profile.id}`}>
                    <Avatar src={m.profile.avatar_url} name={m.profile.display_name} size={32} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${m.profile.id}`} className="text-sm font-medium hover:underline truncate block">{m.profile.display_name}</Link>
                    <p className="text-xs text-[var(--text-soft)] truncate">@{m.profile.username}</p>
                  </div>
                  {m.role === "admin" && <Badge variant="warning"><Crown size={10} /> admin</Badge>}
                  {m.role === "mod" && <Badge variant="info">mod</Badge>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* EDIT MODAL */}
      <EditCommunityModal open={editOpen} onClose={() => setEditOpen(false)} community={community} />

      {/* DELETE CONFIRM */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDel(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border bg-[var(--bg-elev)] p-5 shadow-[var(--shadow-lg)]" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-1">Excluir esta comunidade?</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Todos os membros perderão acesso. Os posts não serão apagados, mas perderão o vínculo com a comunidade.
              <br />Digite <strong>{community.title}</strong> para confirmar.
            </p>
            <ConfirmDelete title={community.title} onConfirm={() => {
              if (!userId) return;
              communitiesApi.remove(community.id, userId);
              notify("Comunidade excluída.", "info");
              navigate("/communities");
            }} onCancel={() => setConfirmDel(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmDelete({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={title} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button variant="danger" disabled={text !== title} onClick={onConfirm}>Excluir definitivamente</Button>
      </div>
    </div>
  );
}

function EditCommunityModal({ open, onClose, community }: { open: boolean; onClose: () => void; community: Community }) {
  const { userId } = useAuth();
  const { notify } = useToast();
  const [title, setTitle] = useState(community.title);
  const [description, setDescription] = useState(community.description);
  const [category, setCategory] = useState(community.category);
  const [rules, setRules] = useState(community.rules);

  function save() {
    if (!userId) return;
    communitiesApi.update(community.id, userId, { title, description, category, rules });
    notify("Comunidade atualizada!", "success");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar comunidade">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Categoria</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Descrição</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Regras</label>
          <Textarea value={rules} onChange={(e) => setRules(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="gradient" onClick={save}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}
