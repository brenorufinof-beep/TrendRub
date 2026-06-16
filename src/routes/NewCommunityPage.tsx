import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button, Card, Input, Textarea } from "../components/ui/Primitives";
import { useAuth } from "../hooks/useAuth";
import { communitiesApi } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

const PALETTES = [
  "linear-gradient(135deg,#06B6D4,#2563EB,#8B5CF6)",
  "linear-gradient(135deg,#8B5CF6,#EC4899)",
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#0F172A,#2563EB)",
  "linear-gradient(135deg,#F472B6,#8B5CF6)",
];

export function NewCommunityPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { notify } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Design");
  const [rules, setRules] = useState("1. Respeito sempre.\n2. Sem spam.\n3. Crédito ao autor original.");
  const [cover, setCover] = useState(PALETTES[0]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !title.trim()) return;
    const c = communitiesApi.create({
      creator_id: userId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || "Geral",
      rules,
      cover_url: cover,
    });
    notify("Comunidade criada com sucesso!", "success");
    navigate(`/community/${c.id}`);
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Voltar</Button>
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <Sparkles className="text-[var(--accent)]" /> Criar nova comunidade
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Defina o nome, categoria e regras. Você será o admin inicial.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <Card className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1.5">Capa</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PALETTES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCover(p)}
                  className={`h-16 rounded-xl border-2 transition ${cover === p ? "border-[var(--primary)] ring-2 ring-[var(--ring)]" : "border-transparent"}`}
                  style={{ background: p }}
                  aria-label="Escolher cor da capa"
                />
              ))}
            </div>
            <div className="mt-3 h-32 rounded-xl relative overflow-hidden" style={{ background: cover }}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
              <div className="absolute bottom-3 left-3 text-white font-bold text-xl drop-shadow">{title || "Sua comunidade"}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: React Brasil" required maxLength={60} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Categoria</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Design, Música, Desafio" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Descrição</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte do que se trata, quem vai amar entrar e o que esperar dos posts." maxLength={300} />
            <p className="text-[11px] text-[var(--text-soft)] mt-1">{description.length}/300</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] block mb-1">Regras</label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={5} />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button type="submit" variant="gradient" disabled={!title.trim()}>Criar comunidade</Button>
        </div>
      </form>
    </div>
  );
}
