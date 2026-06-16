import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Pencil,
  Send,
  Hash,
} from "lucide-react";
import { Avatar, Badge, Button, Card } from "./ui/Primitives";
import { MediaPreview } from "./MediaPreview";
import { useDB, useDBMemo } from "../lib/store";
import { commentsApi, likesApi, postsApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { timeAgo } from "../lib/format";
import type { Post } from "../lib/types";

export function PostCard({ post }: { post: Post }) {
  const { userId } = useAuth();
  const { notify } = useToast();
  const author = useDB((s) => s.profiles.find((p) => p.id === post.user_id));
  const community = useDB((s) => (post.community_id ? s.communities.find((c) => c.id === post.community_id) : null));
  const likes = useDBMemo((s) => s.likes.filter((l) => l.post_id === post.id));
  const comments = useDBMemo((s) => s.comments.filter((c) => c.post_id === post.id));
  const liked = !!likes.find((l) => l.user_id === userId);
  const isMine = userId === post.user_id;

  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(post.text_content);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pop, setPop] = useState(false);

  if (!author) return null;

  function handleLike() {
    if (!userId) return;
    likesApi.toggle(post.id, userId);
    if (!liked) {
      setPop(true);
      setTimeout(() => setPop(false), 350);
    }
  }

  function handleSendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !draft.trim()) return;
    commentsApi.add(post.id, userId, draft);
    setDraft("");
  }

  function handleSaveEdit() {
    if (!userId) return;
    postsApi.update(post.id, userId, { text_content: editValue });
    setEditing(false);
    notify("Post atualizado!", "success");
  }

  function handleDelete() {
    if (!userId) return;
    postsApi.remove(post.id, userId);
    notify("Post excluído.", "info");
  }

  function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    notify("Link copiado!", "success");
  }

  return (
    <Card className="p-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${author.id}`}>
          <Avatar src={author.avatar_url} name={author.display_name} size={44} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to={`/profile/${author.id}`} className="font-semibold hover:underline truncate">
              {author.display_name}
            </Link>
            <span className="text-sm text-[var(--text-soft)]">@{author.username}</span>
            <span className="text-[var(--text-soft)]">·</span>
            <span className="text-sm text-[var(--text-soft)]">{timeAgo(post.created_at)}</span>
            {community && (
              <Link to={`/community/${community.id}`}>
                <Badge variant="violet">in {community.title}</Badge>
              </Link>
            )}
          </div>
        </div>
        {isMine && (
          <div className="relative">
            <button
              aria-label="Opções do post"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--text-muted)]"
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border bg-[var(--bg-elev)] shadow-[var(--shadow-lg)] py-1.5 animate-fade-in"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    onClick={() => {
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-soft)]"
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(true);
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--bg-soft)]"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 ml-[56px]">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-xl border bg-[var(--bg)] px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)" }}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditValue(post.text_content); }}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{post.text_content}</p>
        )}

        {post.hashtags.length > 0 && !editing && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.hashtags.map((h) => (
              <span key={h} className="text-xs text-[var(--primary)] hover:underline cursor-pointer inline-flex items-center gap-0.5">
                <Hash size={10} />{h.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {post.media_url && (
          <div className="mt-3">
            <MediaPreview url={post.media_url} kind={post.content_type === "video" ? "video" : "image"} caption={post.text_content} />
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 text-[var(--text-muted)]">
          <button
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? "Descurtir" : "Curtir"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-soft)] transition ${liked ? "text-rose-500" : ""}`}
          >
            <Heart size={18} className={pop ? "animate-pop" : ""} fill={liked ? "currentColor" : "none"} />
            <span className="text-sm font-medium">{likes.length}</span>
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-soft)] transition"
          >
            <MessageCircle size={18} />
            <span className="text-sm font-medium">{comments.length}</span>
          </button>
          <button
            onClick={handleShare}
            aria-label="Compartilhar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-soft)] transition ml-auto"
          >
            <Share2 size={18} />
          </button>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t space-y-3 animate-fade-in" style={{ borderColor: "var(--border)" }}>
            {comments.length === 0 && (
              <p className="text-sm text-[var(--text-soft)] italic">Sem comentários ainda. Seja o primeiro!</p>
            )}
            {comments.map((c) => (
              <CommentItem key={c.id} commentId={c.id} />
            ))}
            <form onSubmit={handleSendComment} className="flex gap-2 mt-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Comente alguma coisa…"
                aria-label="Novo comentário"
                className="flex-1 h-9 rounded-lg border bg-[var(--bg)] px-3 text-sm"
                style={{ borderColor: "var(--border)" }}
              />
              <Button type="submit" size="sm" variant="gradient" disabled={!draft.trim()}>
                <Send size={14} />
              </Button>
            </form>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" role="alertdialog">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border bg-[var(--bg-elev)] p-5 shadow-[var(--shadow-lg)]" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold mb-1">Excluir post?</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Esta ação é permanente. Todos os likes e comentários também serão removidos.</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button variant="danger" onClick={() => { handleDelete(); setConfirmDelete(false); }}>Sim, excluir</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function CommentItem({ commentId }: { commentId: string }) {
  const { userId } = useAuth();
  const comment = useDB((s) => s.comments.find((c) => c.id === commentId));
  const author = useDB((s) => (comment ? s.profiles.find((p) => p.id === comment.user_id) : null));
  if (!comment || !author) return null;
  const isMine = comment.user_id === userId;
  return (
    <div className="flex gap-2.5 group">
      <Avatar src={author.avatar_url} name={author.display_name} size={32} />
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-[var(--bg-soft)] px-3 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium text-sm truncate">{author.display_name}</span>
            <span className="text-xs text-[var(--text-soft)]">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm break-words">{comment.content}</p>
        </div>
      </div>
      {isMine && (
        <button
          aria-label="Excluir comentário"
          onClick={() => commentsApi.remove(comment.id, comment.user_id)}
          className="opacity-0 group-hover:opacity-100 transition text-[var(--text-soft)] hover:text-[var(--danger)] p-1"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
