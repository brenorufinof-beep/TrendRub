import { useRef, useState, useMemo } from "react";
import { Image as ImageIcon, Video, Send, Smile, X, Globe2, Users } from "lucide-react";
import { Avatar, Badge, Button, Card } from "./ui/Primitives";
import { useAuth } from "../hooks/useAuth";
import { db, useDB, useDBMemo } from "../lib/store";
import { postsApi } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export function Composer({ defaultCommunityId }: { defaultCommunityId?: string }) {
  const { userId, profile } = useAuth();
  const { notify } = useToast();
  
  // Get communities for this user, with memoization to prevent infinite loops
  const myCommunities = useDBMemo((s) =>
    s.members
      .filter((m) => m.user_id === userId)
      .map((m) => s.communities.find((c) => c.id === m.community_id)!)
      .filter(Boolean)
  );

  const [text, setText] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoMode, setVideoMode] = useState(false);
  const [communityId, setCommunityId] = useState<string | "">(defaultCommunityId ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!userId || !profile) return null;

  const canSubmit = (text.trim().length > 0 || imageData || (videoMode && videoUrl.trim())) && text.length <= 500;

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      notify("Apenas imagens são aceitas (PNG, JPG, WEBP).", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notify("Imagem maior que 5 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImageData(String(ev.target?.result ?? ""));
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!canSubmit) return;
    if (videoMode && videoUrl) {
      postsApi.create({
        user_id: userId!,
        text_content: text.trim() || "📹 Novo vídeo",
        content_type: "video",
        media_url: videoUrl.trim(),
        community_id: communityId || null,
      });
    } else if (imageData) {
      postsApi.create({
        user_id: userId!,
        text_content: text.trim(),
        content_type: "image",
        media_url: imageData,
        community_id: communityId || null,
      });
    } else {
      postsApi.create({
        user_id: userId!,
        text_content: text.trim(),
        content_type: "text",
        community_id: communityId || null,
      });
    }
    setText("");
    setImageData(null);
    setVideoUrl("");
    setVideoMode(false);
    notify("Postado! 🚀", "success");
  }

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar src={profile.avatar_url} name={profile.display_name} size={42} />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`O que tá em alta hoje, ${profile.display_name.split(" ")[0]}?`}
            aria-label="Escrever post"
            rows={2}
            className="w-full bg-transparent text-[15px] placeholder:text-[var(--text-soft)] resize-none outline-none"
          />

          {imageData && (
            <div className="relative mt-2 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
              <img src={imageData} alt="Pré-visualização" className="w-full max-h-80 object-cover" />
              <button
                onClick={() => setImageData(null)}
                aria-label="Remover imagem"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {videoMode && (
            <div className="mt-2 flex gap-2 items-center">
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Cole o URL do vídeo (YouTube, Vimeo…)"
                className="flex-1 h-9 rounded-lg border bg-[var(--bg)] px-3 text-sm"
                style={{ borderColor: "var(--border)" }}
              />
              <button onClick={() => { setVideoMode(false); setVideoUrl(""); }} aria-label="Cancelar vídeo" className="p-1.5 rounded-lg hover:bg-[var(--bg-soft)]">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                aria-label="Adicionar imagem"
                className="h-9 w-9 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--cyan)] flex items-center justify-center transition"
              >
                <ImageIcon size={18} />
              </button>
              <button
                onClick={() => setVideoMode((v) => !v)}
                aria-label="Adicionar vídeo"
                className="h-9 w-9 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--accent)] flex items-center justify-center transition"
              >
                <Video size={18} />
              </button>
              <button
                onClick={() => setText((t) => t + " ✨")}
                aria-label="Inserir emoji"
                className="h-9 w-9 rounded-lg hover:bg-[var(--bg-soft)] text-amber-500 flex items-center justify-center transition"
              >
                <Smile size={18} />
              </button>

              <div className="ml-1 relative">
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  aria-label="Postar em comunidade"
                  className="h-9 rounded-lg border bg-[var(--bg)] px-2.5 text-xs appearance-none pr-7"
                  style={{ borderColor: "var(--border)" }}
                >
                  <option value="">Feed global</option>
                  {myCommunities.map((c) => (
                    <option key={c.id} value={c.id}>in {c.title}</option>
                  ))}
                </select>
                {communityId ? (
                  <Users size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
                ) : (
                  <Globe2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs ${text.length > 500 ? "text-[var(--danger)]" : "text-[var(--text-soft)]"}`}>
                {text.length}/500
              </span>
              <Button variant="gradient" disabled={!canSubmit} onClick={submit}>
                <Send size={14} /> Postar
              </Button>
            </div>
          </div>

          {(imageData || videoMode) && (
            <div className="mt-2 flex gap-2">
              {imageData && <Badge variant="info">imagem · pronta</Badge>}
              {videoMode && <Badge variant="violet">vídeo · URL externa</Badge>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
