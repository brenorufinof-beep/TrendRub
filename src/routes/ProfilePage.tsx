import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, MessageSquare, Pencil, UserMinus, UserPlus, Users2 } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, Input, Modal, Textarea } from "../components/ui/Primitives";
import { PostCard } from "../components/PostCard";
import { db, useDB } from "../lib/store";
import { useAuth } from "../hooks/useAuth";
import { followsApi, profilesApi } from "../lib/api";
import { useToast } from "../contexts/ToastContext";
import type { Profile } from "../lib/types";

export function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { notify } = useToast();
  const profileId = id ?? userId ?? "";

  const profile = useDB((s) => s.profiles.find((p) => p.id === profileId));
  const posts = useMemo(
    () => db.getState().posts.filter((p) => p.user_id === profileId).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [profileId]
  );
  const follows = useDB((s) => s.follows);
  const memberCommunities = useMemo(() => {
    const state = db.getState();
    return state.members
      .filter((m) => m.user_id === profileId)
      .map((m) => state.communities.find((c) => c.id === m.community_id)!)
      .filter(Boolean);
  }, [profileId]);

  const followers = useMemo(() => follows.filter((f) => f.following_id === profileId).length, [follows, profileId]);
  const following = useMemo(() => follows.filter((f) => f.follower_id === profileId).length, [follows, profileId]);
  const isFollowing = !!follows.find((f) => f.follower_id === userId && f.following_id === profileId);
  const isMe = profileId === userId;
  const [editOpen, setEditOpen] = useState(false);

  if (!profile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Voltar</Button>
        <EmptyState icon={<Users2 />} title="Perfil não encontrado" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!isMe && (
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Voltar</Button>
      )}
      <Card className="overflow-hidden">
        <div className="h-32 sm:h-40 bg-brand-gradient relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between flex-wrap gap-3 -mt-12">
            <Avatar src={profile.avatar_url} name={profile.display_name} size={92} className="ring-4 ring-[var(--bg-elev)]" />
            <div className="flex gap-2 mb-1">
              {isMe ? (
                <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil size={14} /> Editar perfil</Button>
              ) : (
                <>
                  <Button
                    variant={isFollowing ? "outline" : "gradient"}
                    onClick={() => userId && followsApi.toggle(profileId, userId)}
                  >
                    {isFollowing ? (<><UserMinus size={14} /> Deixar de seguir</>) : (<><UserPlus size={14} /> Seguir</>)}
                  </Button>
                  <Link to={`/messages/${profileId}`}>
                    <Button variant="secondary"><MessageSquare size={14} /> Mensagem</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="mt-3">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <p className="text-sm text-[var(--text-muted)]">@{profile.username}</p>
            {profile.bio && <p className="mt-3 text-[15px] leading-relaxed max-w-xl">{profile.bio}</p>}
            <div className="mt-4 flex items-center gap-5 text-sm">
              <span><strong>{followers}</strong> <span className="text-[var(--text-muted)]">seguidores</span></span>
              <span><strong>{following}</strong> <span className="text-[var(--text-muted)]">seguindo</span></span>
              <span><strong>{posts.length}</strong> <span className="text-[var(--text-muted)]">posts</span></span>
              <span className="ml-auto hidden sm:flex items-center gap-1 text-[var(--text-soft)] text-xs">
                <Calendar size={12} /> desde {new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {memberCommunities.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Comunidades</h3>
          <div className="flex flex-wrap gap-2">
            {memberCommunities.map((c) => (
              <Link key={c.id} to={`/community/${c.id}`} className="inline-flex items-center gap-1.5">
                <Badge variant="violet">{c.title}</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Posts</h2>
        {posts.length === 0 ? (
          <EmptyState icon={<Pencil size={20} />} title="Nenhum post ainda" hint={isMe ? "Compartilhe sua primeira ideia no feed!" : "Esta pessoa ainda não postou nada."} />
        ) : (
          <div className="space-y-4">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </div>

      {isMe && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} onSaved={() => notify("Perfil atualizado!", "success")} />}
    </div>
  );
}

function EditProfileModal({ open, onClose, profile, onSaved }: { open: boolean; onClose: () => void; profile: Profile; onSaved?: () => void }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [avatarSeed, setAvatarSeed] = useState(profile.username);

  function save() {
    profilesApi.update(profile.id, {
      display_name: displayName,
      bio,
      avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}`,
    });
    onSaved?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(avatarSeed)}`} name={displayName} size={64} />
          <div className="flex-1">
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Avatar (seed)</label>
            <Input value={avatarSeed} onChange={(e) => setAvatarSeed(e.target.value)} />
            <p className="text-[11px] text-[var(--text-soft)] mt-1">Use qualquer texto para gerar um avatar único.</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Nome de exibição</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Bio</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
          <p className="text-[11px] text-[var(--text-soft)] mt-1">{bio.length}/160</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="gradient" onClick={save}>Salvar</Button>
        </div>
      </div>
    </Modal>
  );
}
