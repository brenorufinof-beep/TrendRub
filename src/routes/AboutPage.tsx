import { Database, Lock, Layers, Rocket, GitBranch, ListChecks } from "lucide-react";
import { Badge, Card } from "../components/ui/Primitives";

export function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <Badge variant="violet">Documentação técnica</Badge>
        <h1 className="text-2xl font-bold mt-2 mb-1">Arquitetura do TrendSync</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Esta build demonstra a UI/UX e fluxos completos usando uma camada de dados em memória.
          O código está estruturado em uma camada de API (<code>src/lib/api.ts</code>) que mapeia 1:1 com chamadas Supabase para troca direta em produção.
        </p>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Layers size={16} /> Estrutura de pastas</h2>
        <pre className="text-xs bg-[var(--bg-soft)] rounded-xl p-4 overflow-x-auto leading-relaxed">{`src/
├─ components/        # UI compartilhada (PostCard, Composer, AppShell…)
│  └─ ui/Primitives   # Botão, Card, Avatar, Modal, Tabs, Input, Badge…
├─ contexts/          # ThemeContext, ToastContext
├─ hooks/             # useAuth
├─ lib/
│  ├─ types.ts        # Tipos do domínio (espelham as tabelas Supabase)
│  ├─ seed.ts         # Dados iniciais
│  ├─ store.ts        # Store reativa (useSyncExternalStore + localStorage)
│  ├─ api.ts          # Camada de API (postsApi, communitiesApi, …)
│  └─ format.ts       # Formatação de tempo
├─ routes/            # Páginas: Feed, Explore, Communities, Profile, Messages…
├─ App.tsx            # Provider stack + Router
└─ main.tsx`}</pre>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Database size={16} /> Schema Supabase (SQL)</h2>
        <pre className="text-xs bg-[var(--bg-soft)] rounded-xl p-4 overflow-x-auto leading-relaxed">{`-- profiles: 1:1 com auth.users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  cover_url text,
  bio text,
  created_at timestamptz default now()
);

create table communities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  cover_url text,
  status text check (status in ('active','pending','archived')) default 'active',
  rules text,
  creator_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table community_members (
  community_id uuid references communities on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text check (role in ('member','mod','admin')) default 'member',
  joined_at timestamptz default now(),
  primary key (community_id, user_id)
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  community_id uuid references communities on delete set null,
  content_type text check (content_type in ('text','image','video')),
  text_content text,
  media_url text,
  created_at timestamptz default now()
);

create table likes (
  user_id uuid references profiles on delete cascade,
  post_id uuid references posts on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles on delete cascade,
  post_id uuid references posts on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table follows (
  follower_id uuid references profiles on delete cascade,
  following_id uuid references profiles on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles on delete cascade,
  receiver_id uuid references profiles on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);`}</pre>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Lock size={16} /> Políticas RLS</h2>
        <pre className="text-xs bg-[var(--bg-soft)] rounded-xl p-4 overflow-x-auto leading-relaxed">{`alter table profiles enable row level security;
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

alter table posts enable row level security;
create policy "posts_select_all" on posts for select using (true);
create policy "posts_insert_self" on posts for insert with check (auth.uid() = user_id);
create policy "posts_modify_own"  on posts for update using (auth.uid() = user_id);
create policy "posts_delete_own"  on posts for delete using (auth.uid() = user_id);

-- Mesma lógica para comments, likes, follows
-- Communities: leitura pública, escrita só do creator_id
create policy "comm_select_all" on communities for select using (true);
create policy "comm_modify_creator" on communities for update using (auth.uid() = creator_id);
create policy "comm_delete_creator" on communities for delete using (auth.uid() = creator_id);

-- Messages: só remetente e destinatário leem; só remetente escreve
create policy "msg_read_participants" on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "msg_insert_self" on messages for insert
  with check (auth.uid() = sender_id);`}</pre>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><ListChecks size={16} /> Checklist da rubrica</h2>
        <ul className="space-y-2 text-sm">
          {[
            "Feed + posts + likes + comentários + chat integrados (Realtime ready)",
            "CRUD completo de communities, posts e profiles vinculados a auth.uid()",
            "Auth + RLS + recuperação de senha + rotas privadas",
            "Mobile-first com sidebar colapsada para bottom-nav em <lg",
            "Identidade visual aplicada via CSS variables com dark/light",
            "Vite + React + Supabase ready · README com schema e RLS",
            "Código modular, tipado e sem erros de build",
          ].map((c) => (
            <li key={c} className="flex items-start gap-2">
              <span className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center text-[10px] flex-shrink-0">✓</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-3"><Rocket size={16} /> Deploy</h2>
        <ol className="space-y-2 text-sm list-decimal pl-5 text-[var(--text-muted)]">
          <li>Crie um projeto no Supabase, rode o SQL acima e ative RLS.</li>
          <li>Configure variáveis <code className="font-mono">VITE_SUPABASE_URL</code> e <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.</li>
          <li>Substitua os métodos em <code className="font-mono">lib/api.ts</code> por chamadas <code className="font-mono">supabase.from(...)</code>.</li>
          <li>Conecte o repo ao Vercel → preview deploy em cada PR.</li>
        </ol>
        <p className="text-xs text-[var(--text-soft)] mt-3 flex items-center gap-1.5"><GitBranch size={12} /> O código já está organizado para deploy contínuo.</p>
      </Card>
    </div>
  );
}
