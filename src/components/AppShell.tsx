import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Compass,
  MessageSquare,
  User,
  LogOut,
  Search,
  Bell,
  Plus,
  TrendingUp,
  Users2,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, Badge, Button } from "./ui/Primitives";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../lib/api";
import { useDB } from "../lib/store";
import { useToast } from "../contexts/ToastContext";
import { trendingHashtags } from "../lib/seed";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Feed", Icon: Home, end: true },
  { to: "/explore", label: "Explorar", Icon: Compass },
  { to: "/communities", label: "Comunidades", Icon: Users2 },
  { to: "/messages", label: "Mensagens", Icon: MessageSquare },
  { to: "/profile", label: "Meu perfil", Icon: User },
];

export function AppShell() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const unreadCount = useDB((s) =>
    s.messages.filter((m) => m.receiver_id === s.currentUserId && !m.read_at).length
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profiles = useDB((s) => s.profiles);
  const communities = useDB((s) => s.communities);

  async function logout() {
    await authApi.signOut();
    notify("Sessão encerrada.", "info");
    navigate("/login");
  }

  const filteredP = search.trim() ? profiles.filter((p) => p.username.toLowerCase().includes(search.toLowerCase()) || p.display_name.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : [];
  const filteredC = search.trim() ? communities.filter((c) => c.title.toLowerCase().includes(search.toLowerCase())).slice(0, 5) : [];

  return (
    <div className="min-h-screen bg-mesh">
      {/* ===== HEADER ===== */}
      <header
        className="sticky top-0 z-40 glass border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 h-16 flex items-center gap-3">
          <Logo />
          <div className="hidden md:flex flex-1 max-w-md mx-auto relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              placeholder="Buscar pessoas, comunidades, trends…"
              aria-label="Buscar"
              className="w-full h-10 rounded-xl border bg-[var(--bg-soft)] pl-10 pr-3 text-sm placeholder:text-[var(--text-soft)]"
              style={{ borderColor: "var(--border)" }}
            />
            {searchOpen && search.trim() && (
              <div className="absolute top-12 left-0 right-0 rounded-xl border bg-[var(--bg-elev)] shadow-[var(--shadow-lg)] py-2 max-h-80 overflow-auto animate-fade-in z-50" style={{ borderColor: "var(--border)" }}>
                {filteredP.length === 0 && filteredC.length === 0 && (
                  <p className="px-4 py-3 text-sm text-[var(--text-soft)]">Nada encontrado.</p>
                )}
                {filteredP.length > 0 && (
                  <>
                    <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-soft)]">Pessoas</p>
                    {filteredP.map((p) => (
                      <Link key={p.id} to={`/profile/${p.id}`} onClick={() => setSearch("")} className="flex items-center gap-2.5 px-4 py-2 hover:bg-[var(--bg-soft)]">
                        <Avatar src={p.avatar_url} name={p.display_name} size={28} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.display_name}</p>
                          <p className="text-xs text-[var(--text-soft)] truncate">@{p.username}</p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
                {filteredC.length > 0 && (
                  <>
                    <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-soft)] mt-2">Comunidades</p>
                    {filteredC.map((c) => (
                      <Link key={c.id} to={`/community/${c.id}`} onClick={() => setSearch("")} className="flex items-center gap-2.5 px-4 py-2 hover:bg-[var(--bg-soft)]">
                        <span className="h-7 w-7 rounded-lg" style={{ background: c.cover_url }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          <p className="text-xs text-[var(--text-soft)] truncate">{c.category}</p>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Link to="/messages" className="relative h-10 w-10 rounded-xl border bg-[var(--bg-elev)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center" style={{ borderColor: "var(--border)" }} aria-label="Mensagens">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[var(--danger)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            {profile && (
              <Link to="/profile" className="hidden sm:block" aria-label="Meu perfil">
                <Avatar src={profile.avatar_url} name={profile.display_name} size={36} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN GRID ===== */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 grid grid-cols-12 gap-6 py-6 pb-24 lg:pb-6">
        {/* Left sidebar (desktop) */}
        <aside className="hidden lg:block col-span-3">
          <nav className="sticky top-24 space-y-1.5">
            {navItems.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[15px] transition ${
                    isActive
                      ? "bg-[var(--bg-elev)] text-[var(--text)] shadow-[var(--shadow-sm)] border"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-soft)] border border-transparent"
                  }`
                }
                style={({ isActive }) => (isActive ? { borderColor: "var(--border)" } : undefined)}
              >
                <Icon size={20} />
                {label}
                {to === "/messages" && unreadCount > 0 && (
                  <Badge variant="info" className="ml-auto">{unreadCount}</Badge>
                )}
              </NavLink>
            ))}
            <Link to="/communities/new" className="block mt-4">
              <Button variant="gradient" size="lg" className="w-full">
                <Plus size={18} /> Nova comunidade
              </Button>
            </Link>
            <button
              onClick={logout}
              className="mt-2 flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-medium text-[15px] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-soft)] transition"
            >
              <LogOut size={20} /> Sair
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="col-span-12 lg:col-span-6 min-w-0">
          <Outlet />
        </main>

        {/* Right rail (desktop) */}
        <aside className="hidden lg:block col-span-3">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border bg-[var(--bg-elev)] p-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={16} className="text-[var(--accent)]" />
                <h3 className="font-semibold text-sm">Trending agora</h3>
              </div>
              <ul className="space-y-2">
                {trendingHashtags.map((t) => (
                  <li key={t.tag} className="flex items-center justify-between gap-2 hover:bg-[var(--bg-soft)] -mx-2 px-2 py-1.5 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{t.tag}</p>
                      <p className="text-xs text-[var(--text-soft)]">{t.count.toLocaleString("pt-BR")} posts</p>
                    </div>
                    <Sparkles size={14} className="text-[var(--cyan)] opacity-70" />
                  </li>
                ))}
              </ul>
            </div>
            <SuggestionsCard />
          </div>
        </aside>
      </div>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="grid grid-cols-5">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] ${
                  isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                }`
              }
            >
              <div className="relative">
                <Icon size={20} />
                {to === "/messages" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 px-1 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SuggestionsCard() {
  const { userId } = useAuth();
  const profiles = useDB((s) => s.profiles);
  const follows = useDB((s) => s.follows);
  const suggestions = profiles
    .filter((p) => p.id !== userId && !follows.find((f) => f.follower_id === userId && f.following_id === p.id))
    .slice(0, 3);
  if (suggestions.length === 0) return null;
  return (
    <div className="rounded-2xl border bg-[var(--bg-elev)] p-4" style={{ borderColor: "var(--border)" }}>
      <h3 className="font-semibold text-sm mb-3">Sugestões para você</h3>
      <ul className="space-y-3">
        {suggestions.map((p) => (
          <li key={p.id} className="flex items-center gap-2.5">
            <Link to={`/profile/${p.id}`}>
              <Avatar src={p.avatar_url} name={p.display_name} size={36} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link to={`/profile/${p.id}`} className="text-sm font-medium hover:underline truncate block">{p.display_name}</Link>
              <p className="text-xs text-[var(--text-soft)] truncate">@{p.username}</p>
            </div>
            <FollowButton targetId={p.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// Inline to avoid extra file
import { followsApi } from "../lib/api";
function FollowButton({ targetId }: { targetId: string }) {
  const { userId } = useAuth();
  const follows = useDB((s) => s.follows);
  const following = !!follows.find((f) => f.follower_id === userId && f.following_id === targetId);
  if (!userId) return null;
  return (
    <Button size="sm" variant={following ? "outline" : "primary"} onClick={() => followsApi.toggle(targetId, userId)}>
      {following ? "Seguindo" : "Seguir"}
    </Button>
  );
}
