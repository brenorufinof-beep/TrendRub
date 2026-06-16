# 📋 Checklist de Execução — Supabase Setup

## Arquivos SQL Prontos

Você tem **2 arquivos SQL** prontos para executar no Supabase:

### 1️⃣ `supabase_schema.sql` (Execute PRIMEIRO)
**O que faz:**
- ✅ Cria 8 tabelas (profiles, communities, posts, likes, comments, follows, messages, community_members)
- ✅ Cria índices para performance
- ✅ Cria triggers automáticos
- ✅ Ativa Row Level Security (RLS)
- ✅ Cria 30+ políticas de segurança
- ✅ Cria trigger que auto-cria perfil quando usuário registra

**Como executar:**
1. Vá para Supabase Dashboard → **SQL Editor**
2. Clique em **"New query"**
3. Abra `supabase_schema.sql` e copie TODO o conteúdo
4. Cole no editor
5. Clique em **"Run"** (botão azul)
6. Espere até aparecer ✅ "Success"

---

### 2️⃣ `supabase_storage_policies.sql` (Execute DEPOIS)
**O que faz:**
- ✅ Cria 4 policies para bucket `avatars`
- ✅ Cria 4 policies para bucket `post-media`
- ✅ Cria 4 policies para bucket `community-covers`

**⚠️ MAS ANTES, você PRECISA:**
1. Ir para **Storage** (menu lateral)
2. Clicar em **"Create a new bucket"**
3. Criar 3 buckets (um por um):
   - Nome: `avatars` → marque "Public bucket" → Create
   - Nome: `post-media` → marque "Public bucket" → Create
   - Nome: `community-covers` → marque "Public bucket" → Create

**Depois, para executar as policies:**
1. Volta ao **SQL Editor**
2. Clique em **"New query"**
3. Abra `supabase_storage_policies.sql` e copie TODO o conteúdo
4. Cole no editor
5. Clique em **"Run"**
6. Espere até aparecer ✅ "Success"

---

## 🚀 ORDEM CORRETA DE EXECUÇÃO

```
PASSO 1: SQL Schema
─────────────────
SQL Editor → New Query → supabase_schema.sql → Run
✅ Espera success

        ↓

PASSO 2: Criar Buckets (UI)
──────────────────────────
Storage → Create bucket → avatars (Public)
Storage → Create bucket → post-media (Public)
Storage → Create bucket → community-covers (Public)
✅ Verifica se aparecem 3 buckets

        ↓

PASSO 3: Storage Policies
────────────────────────
SQL Editor → New Query → supabase_storage_policies.sql → Run
✅ Espera success

        ↓

✅ PRONTO! Sistema configurado!
```

---

## ✅ Checklist Final

Marque conforme completa:

- [ ] Executou `supabase_schema.sql` com sucesso
- [ ] Criou bucket `avatars` (Public)
- [ ] Criou bucket `post-media` (Public)
- [ ] Criou bucket `community-covers` (Public)
- [ ] Executou `supabase_storage_policies.sql` com sucesso
- [ ] Preencheu `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- [ ] Testou: fazer login / criar post / enviar mensagem

---

## 📝 Notas Importantes

**Sobre as tabelas:**
- `profiles` → vinculada ao `auth.users` (auto-criar perfil ao registrar)
- `communities` → comunidades criadas por usuários
- `posts` → posts públicos (em feed ou comunidades)
- `messages` → mensagens privadas 1:1
- Todas com RLS ativado (segurança automática)

**Sobre o Storage:**
- Cada bucket é `Public` → arquivos visíveis por todos
- Policies garantem que só o dono pode fazer upload/update/delete
- Arquivos organizados em pastas por user-id

**Sobre RLS (Row Level Security):**
- Cada usuário só vê seus próprios dados quando faz sense
- Mensagens: só o sender e receiver veem
- Profiles: todos podem ler, mas só o dono edita
- Posts: todos leem, mas só o criador edita/deleta

---

## 🎯 Pronto para Next Steps?

Após completar tudo acima, você pode:
1. Implementar autenticação no app (usar Supabase Auth)
2. Conectar app ao Supabase real (em vez de mock API)
3. Testar funcionalidades completas
4. Deploy em produção

---

## 🔗 Links Úteis

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Docs](https://supabase.com/docs)
- [RLS Examples](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Docs](https://supabase.com/docs/guides/storage)
