import { Play, ImageIcon, Link2 } from "lucide-react";

/**
 * Renders a "media" preview for a post.
 * - "gradient:linear-gradient(...)" => decorative gradient (mock for uploaded images)
 * - "data:image/..."                 => uploaded image (object URL)
 * - http(s)://...                   => external image or video link
 */
export function MediaPreview({
  url,
  kind,
  caption,
}: {
  url: string;
  kind: "image" | "video";
  caption?: string;
}) {
  if (!url) return null;

  if (url.startsWith("gradient:")) {
    const grad = url.slice("gradient:".length);
    return (
      <div
        className="relative aspect-[16/10] w-full rounded-xl overflow-hidden flex items-center justify-center"
        style={{ background: grad }}
        aria-label={caption || "Imagem decorativa"}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_60%)]" />
        <ImageIcon size={42} className="text-white/70 drop-shadow" />
      </div>
    );
  }

  if (url.startsWith("data:image") || /\.(png|jpe?g|webp|gif|svg)$/i.test(url)) {
    return (
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <img src={url} alt={caption || "Imagem do post"} className="w-full h-auto object-cover" loading="lazy" />
      </div>
    );
  }

  if (kind === "video") {
    const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);

    if (youtubeMatch) {
      return (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&showinfo=0`}
            title={caption || "YouTube video"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (vimeoMatch) {
      return (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
            title={caption || "Vimeo video"}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (isDirectVideo) {
      return (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          <video controls className="w-full h-auto bg-black" src={url} />
        </div>
      );
    }

    return (
      <a
        href={url}
        className="block rounded-xl border px-4 py-3 text-sm text-[var(--primary)] hover:underline truncate"
        style={{ borderColor: "var(--border)" }}
      >
        <Link2 size={14} className="inline mr-1" /> Abrir vídeo
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border px-4 py-3 text-sm text-[var(--primary)] hover:underline truncate"
      style={{ borderColor: "var(--border)" }}
    >
      <Link2 size={14} className="inline mr-1" /> {url}
    </a>
  );
}
