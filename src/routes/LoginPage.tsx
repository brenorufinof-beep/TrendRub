import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Zap, Users2, MessageSquare, ArrowRight, AtSign, User as UserIcon, KeyRound } from "lucide-react";
import { Button, Card, Input, Tabs } from "../components/ui/Primitives";
import { ThemeToggle } from "../components/ThemeToggle";
import { Logo } from "../components/Logo";
import { authApi } from "../lib/api";
import { useToast } from "../contexts/ToastContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");

  const [username, setUsername] = useState("voce");
  const [password, setPassword] = useState("demo1234");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const res = await authApi.signIn(username, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      notify(`Bem-vindo, ${res.profile!.display_name}! 👋`, "success");
      navigate("/");
    } else if (mode === "signup") {
      if (!username || !displayName) {
        setError("Preencha nome e username.");
        setLoading(false);
        return;
      }
      const res = await authApi.signUp({ username, display_name: displayName, password, bio });
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      notify(`Conta criada! Bora explorar trends.`, "success");
      navigate("/");
    } else {
      notify("Se a conta existir, enviamos um link de recuperação.", "info");
      setMode("signin");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-mesh">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="relative z-10 flex items-center gap-2.5 text-white">
          <span className="bg-white/15 backdrop-blur rounded-xl h-10 w-10 flex items-center justify-center text-xl font-black">T</span>
          <span className="text-xl font-bold">TrendSync</span>
        </div>
        <div className="relative z-10 text-white max-w-md space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 backdrop-blur px-3 py-1 rounded-full">
            <Sparkles size={12} /> v1.0 — Beta acadêmico
          </span>
          <h1 className="text-4xl font-bold leading-tight">
            Trends, desafios e<br />comunidades de nicho<br />em um só feed.
          </h1>
          <p className="text-white/85 leading-relaxed">
            Conecte-se com criadores, participe de desafios diários e descubra o que está em alta nas comunidades que você ama.
          </p>
          <ul className="space-y-2.5 text-white/90 text-sm pt-2">
            <li className="flex items-center gap-2.5"><Zap size={16} /> Feed em tempo real com filtros inteligentes</li>
            <li className="flex items-center gap-2.5"><Users2 size={16} /> Comunidades, desafios e papéis (admin/mod)</li>
            <li className="flex items-center gap-2.5"><MessageSquare size={16} /> Mensagens privadas 1:1 com indicadores de leitura</li>
          </ul>
        </div>
        <div className="relative z-10 text-white/70 text-xs">
          © 2026 TrendSync · Projeto acadêmico full-stack
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden border-b" style={{ borderColor: "var(--border)" }}>
          <Logo />
          <ThemeToggle compact />
        </div>
        <div className="hidden lg:flex justify-end p-5">
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8">
          <Card className="w-full max-w-md p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1">
                {mode === "signin" && "Entrar"}
                {mode === "signup" && "Criar conta"}
                {mode === "reset" && "Recuperar senha"}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {mode === "signin" && "Acesse o feed e sincronize-se com as trends do dia."}
                {mode === "signup" && "Em 30 segundos você está dentro."}
                {mode === "reset" && "Te enviaremos um link para redefinir sua senha."}
              </p>
            </div>

            {mode !== "reset" && (
              <Tabs
                className="mb-5"
                active={mode}
                onChange={(v) => setMode(v as typeof mode)}
                tabs={[
                  { value: "signin", label: "Entrar" },
                  { value: "signup", label: "Cadastrar" },
                ]}
              />
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <Field label="Nome de exibição" icon={<UserIcon size={14} />}>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ex: Ana Souza" required />
                </Field>
              )}
              <Field label="Username" icon={<AtSign size={14} />}>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="voce" required autoComplete="username" />
              </Field>
              {mode !== "reset" && (
                <Field label="Senha" icon={<KeyRound size={14} />}>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                </Field>
              )}
              {mode === "signup" && (
                <Field label="Bio (opcional)">
                  <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte algo sobre você" />
                </Field>
              )}
              {error && (
                <p className="text-sm text-[var(--danger)] bg-[var(--danger)]/10 px-3 py-2 rounded-lg" role="alert">{error}</p>
              )}
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                {loading ? "Aguarde…" : (
                  <>
                    {mode === "signin" && "Entrar"}
                    {mode === "signup" && "Criar conta"}
                    {mode === "reset" && "Enviar link"}
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
              {mode === "signin" && (
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setMode("reset")} className="text-[var(--primary)] hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
              )}
              {mode === "reset" && (
                <button type="button" onClick={() => setMode("signin")} className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                  ← Voltar para login
                </button>
              )}
            </form>

            <div className="mt-6 pt-5 border-t text-xs text-[var(--text-soft)] space-y-1.5" style={{ borderColor: "var(--border)" }}>
              <p className="font-semibold text-[var(--text-muted)]">🔐 Contas de demonstração</p>
              <p>username: <code className="font-mono">voce</code>, <code className="font-mono">lia.codes</code>, <code className="font-mono">rafa.move</code>, <code className="font-mono">theo.dev</code></p>
              <p>(Senha agora é usada para autenticação real via Supabase)</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-1.5">
        {icon}{label}
      </span>
      {children}
    </label>
  );
}
