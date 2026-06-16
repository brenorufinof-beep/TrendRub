import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, Send, CheckCheck, Search } from "lucide-react";
import { Avatar, Button, Card, EmptyState, Input } from "../components/ui/Primitives";
import { useDB, useDBMemo } from "../lib/store";
import { useAuth } from "../hooks/useAuth";
import { getConversations, messagesApi } from "../lib/api";
import { fmtDay, fmtTime, timeAgo } from "../lib/format";

export function MessagesPage() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const messages = useDB((s) => s.messages);
  const profiles = useDB((s) => s.profiles);
  const [search, setSearch] = useState("");

  // re-derive conversations when messages change
  const conversations = useMemo(() => (userId ? getConversations(userId) : []), [messages, userId]);

  const filteredConv = useMemo(() => {
    if (!search.trim()) return conversations;
    const t = search.toLowerCase();
    return conversations.filter((c) => c.partner.display_name.toLowerCase().includes(t) || c.partner.username.toLowerCase().includes(t));
  }, [conversations, search]);

  // Mobile: show either list or chat. Desktop: side-by-side.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const showList = !isMobile || !partnerId;
  const showChat = !isMobile || !!partnerId;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
          <MessageSquare className="text-[var(--cyan)]" /> Mensagens
        </h1>
        <p className="text-sm text-[var(--text-muted)]">Conversas privadas 1:1 com leitura em tempo real.</p>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4 min-h-[60vh]">
        {/* Conversations list */}
        {showList && (
          <Card className="p-3 flex flex-col">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)] pointer-events-none" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conversas…" className="h-9 pl-9 text-sm" />
            </div>
            <div className="flex-1 overflow-auto space-y-1">
              {filteredConv.length === 0 ? (
                <p className="text-sm text-[var(--text-soft)] text-center py-6">Nada por aqui.</p>
              ) : (
                filteredConv.map((c) => {
                  const active = partnerId === c.partner.id;
                  return (
                    <button
                      key={c.partner.id}
                      onClick={() => navigate(`/messages/${c.partner.id}`)}
                      className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition ${
                        active ? "bg-[var(--bg-soft)]" : "hover:bg-[var(--bg-soft)]"
                      }`}
                    >
                      <div className="relative">
                        <Avatar src={c.partner.avatar_url} name={c.partner.display_name} size={40} />
                        {c.unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{c.partner.display_name}</span>
                          <span className="text-[11px] text-[var(--text-soft)] flex-shrink-0">{timeAgo(c.lastMessage.created_at)}</span>
                        </div>
                        <p className={`text-xs truncate ${c.unread > 0 ? "text-[var(--text)] font-medium" : "text-[var(--text-muted)]"}`}>
                          {c.lastMessage.sender_id === userId ? "Você: " : ""}{c.lastMessage.content}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
              {/* New chat suggestions */}
              <div className="pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-soft)] px-2 mb-1.5">Sugestões</p>
                {profiles.filter((p) => p.id !== userId && !conversations.find((c) => c.partner.id === p.id)).slice(0, 3).map((p) => (
                  <button key={p.id} onClick={() => navigate(`/messages/${p.id}`)} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-[var(--bg-soft)]">
                    <Avatar src={p.avatar_url} name={p.display_name} size={32} />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{p.display_name}</p>
                      <p className="text-[11px] text-[var(--text-soft)] truncate">@{p.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Chat window */}
        {showChat && (
          <Card className="p-0 flex flex-col overflow-hidden">
            {partnerId ? (
              <ChatWindow partnerId={partnerId} onBack={() => navigate("/messages")} />
            ) : (
              <EmptyState icon={<MessageSquare />} title="Selecione uma conversa" hint="Ou comece uma nova a partir de um perfil." />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function ChatWindow({ partnerId, onBack }: { partnerId: string; onBack: () => void }) {
  const { userId } = useAuth();
  const partner = useDB((s) => s.profiles.find((p) => p.id === partnerId));
  const messages = useDBMemo((s) =>
    s.messages
      .filter(
        (m) =>
          (m.sender_id === userId && m.receiver_id === partnerId) ||
          (m.sender_id === partnerId && m.receiver_id === userId)
      )
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
  );
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // mark read when entering / messages arrive
  useEffect(() => {
    if (userId) messagesApi.markRead(userId, partnerId);
  }, [userId, partnerId, messages.length]);

  // autoscroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !draft.trim()) return;
    messagesApi.send(userId, partnerId, draft);
    setDraft("");
  }

  if (!partner) return <EmptyState icon={<MessageSquare />} title="Usuário não encontrado" />;

  // Group by day
  const groups: { day: string; items: typeof messages }[] = [];
  for (const m of messages) {
    const day = fmtDay(m.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(m);
    else groups.push({ day, items: [m] });
  }

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <button onClick={onBack} className="md:hidden p-1.5 rounded-lg hover:bg-[var(--bg-soft)]" aria-label="Voltar">
          <ArrowLeft size={18} />
        </button>
        <Link to={`/profile/${partner.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition">
          <Avatar src={partner.avatar_url} name={partner.display_name} size={38} />
          <div>
            <p className="font-semibold leading-tight">{partner.display_name}</p>
            <p className="text-xs text-[var(--text-soft)]">@{partner.username}</p>
          </div>
        </Link>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-[var(--text-soft)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh] min-h-[300px]">
        {groups.map((g) => (
          <div key={g.day} className="space-y-2">
            <p className="text-center text-[11px] uppercase tracking-wider text-[var(--text-soft)] my-2">{g.day}</p>
            {g.items.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? "bg-brand-gradient text-white rounded-br-sm" : "bg-[var(--bg-soft)] text-[var(--text)] rounded-bl-sm"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${mine ? "text-white/80 justify-end" : "text-[var(--text-soft)]"}`}>
                      <span>{fmtTime(m.created_at)}</span>
                      {mine && <CheckCheck size={12} className={m.read_at ? "text-cyan-300" : "opacity-60"} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="border-t p-3 flex gap-2" style={{ borderColor: "var(--border)" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Mensagem para ${partner.display_name.split(" ")[0]}…`}
          aria-label="Escrever mensagem"
          className="flex-1 h-10 rounded-xl border bg-[var(--bg)] px-3 text-sm"
          style={{ borderColor: "var(--border)" }}
        />
        <Button type="submit" variant="gradient" disabled={!draft.trim()}>
          <Send size={16} />
        </Button>
      </form>
    </>
  );
}
