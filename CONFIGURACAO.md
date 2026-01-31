# Passo a passo: Git, Supabase e Vercel

Guia para conectar o projeto **Academia Nutricional** ao Git (GitHub), Supabase e Vercel.

---

## Parte 1 — Conectar ao Git (GitHub)

### 1.1 Inicializar o repositório local (se ainda não fez)

No terminal, na pasta do projeto:

```bash
cd c:\clickDEV\Vanderson\academia-nutricional
git init
```

### 1.2 Criar o repositório remoto no GitHub

1. Acesse [github.com](https://github.com) e faça login.
2. Clique em **"+"** (canto superior direito) → **"New repository"**.
3. Preencha:
   - **Repository name:** `academia-nutricional` (ou outro nome).
   - **Description:** opcional (ex.: "Plataforma Academia Nutricional").
   - **Public** ou **Private**, como preferir.
   - **Não** marque "Add a README" (o projeto já tem um).
4. Clique em **"Create repository"**.

### 1.3 Conectar o projeto ao repositório remoto

No terminal, ainda na pasta do projeto:

```bash
# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "chore: setup inicial do projeto Academia Nutricional"

# Adicionar o remoto (troque SEU-USUARIO e academia-nutricional se mudou o nome)
git remote add origin https://github.com/SEU-USUARIO/academia-nutricional.git

# Enviar para o GitHub (branch main)
git branch -M main
git push -u origin main
```

Se o GitHub pedir autenticação:

- **HTTPS:** use um Personal Access Token (Settings → Developer settings → Personal access tokens) no lugar da senha.
- **SSH:** use uma chave SSH e o endereço `git@github.com:SEU-USUARIO/academia-nutricional.git` em vez de `https://...`.

---

## Parte 2 — Conectar ao Supabase

### 2.1 Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie conta).
2. Clique em **"New Project"**.
3. Preencha:
   - **Name:** ex. `academia-nutricional`.
   - **Database Password:** crie uma senha forte e **guarde** (para o banco).
   - **Region:** escolha a mais próxima (ex.: South America).
4. Clique em **"Create new project"** e aguarde o projeto ser criado.

### 2.2 Pegar a URL e a chave anônima (anon key)

1. No painel do projeto, vá em **Settings** (ícone de engrenagem) → **API**.
2. Anote:
   - **Project URL** (ex.: `https://xxxxx.supabase.co`).
   - **anon public** (chave pública, sob "Project API keys").

### 2.3 Configurar variáveis de ambiente no seu PC

1. Na raiz do projeto, crie um arquivo chamado **`.env.local`** (se ainda não existir).
2. Cole o conteúdo abaixo e **substitua** pelos valores do seu projeto:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

- Troque `https://SEU-PROJECT-ID.supabase.co` pela **Project URL**.
- Troque `sua-anon-key-aqui` pela chave **anon public**.

3. Salve o arquivo. O `.env.local` **não** é commitado (está no `.gitignore`).

### 2.4 Aplicar schema e migrations no Supabase (Opção A)

Para o app funcionar (receitas, treinos, planos, perfis), o banco precisa das tabelas e das policies. Use **uma** das formas abaixo.

**Via CLI (recomendado)**

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado e linkado ao projeto:

```bash
supabase db push
```

Isso aplica as migrations na ordem (002, 003, 004, 005…). O schema base (`supabase/schema.sql`) deve ter sido aplicado antes ou estar incluído na sua configuração inicial do Supabase.

**Via Supabase SQL Editor**

1. **Primeiro:** rode o **schema base** que cria as tabelas (`recipes`, `workouts`, `daily_plans`, `profiles`, `daily_logs`, etc.).
   - Abra **Supabase → SQL Editor → New query**.
   - Cole o conteúdo de **`supabase/schema.sql`** e execute.

2. **Depois:** rode as **migrations em ordem** (cada arquivo em uma query, na sequência):
   - `supabase/migrations/002_add_indexes.sql`
   - `supabase/migrations/003_fasting_preferences.sql`
   - `supabase/migrations/004_ai_threads.sql`
   - `supabase/migrations/005_rls_public_and_auth_trigger.sql`

**Importante:** a **005** deve ser rodada **depois** que as tabelas existirem (ela habilita RLS e cria policies em cima delas). Se rodar antes do schema, dará erro de “relation does not exist”.

Depois de aplicar tudo, rode o seed global para popular receitas e treinos: `npm run seed:global` (com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`).

### 2.5 Configurar variáveis no GitHub (quando usar CI/deploy)

Se for usar GitHub Actions ou deploy (ex.: Vercel):

1. No repositório no GitHub: **Settings** → **Secrets and variables** → **Actions** (ou **Environments** no Vercel).
2. Crie os **secrets** (ou variáveis):
   - `NEXT_PUBLIC_SUPABASE_URL` = sua Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key.

Assim o código não fica com as chaves no repositório.

### 2.6 Testar a conexão

Com o `.env.local` preenchido:

```bash
npm run dev
```

O app já está configurado para usar o cliente Supabase. Quando você criar telas que usem o cliente em `lib/supabase.ts`, a conexão será feita automaticamente com essas variáveis.

---

## Parte 3 — Conectar ao Vercel (deploy)

### 3.1 Criar conta e importar o projeto

1. Acesse [vercel.com](https://vercel.com) e faça login (ou crie conta). Use **"Continue with GitHub"** para vincular ao mesmo usuário do repositório.
2. No dashboard, clique em **"Add New..."** → **"Project"**.
3. Na lista de repositórios, encontre **`vander-supa3/academia-nutricional`** (ou o nome do seu repo) e clique em **"Import"**.

### 3.2 Configurar o projeto

1. **Project Name:** pode deixar `academia-nutricional` (ou alterar).
2. **Framework Preset:** o Vercel deve detectar **Next.js** automaticamente.
3. **Root Directory:** deixe em branco (raiz do repo).
4. **Build and Output Settings:** pode deixar o padrão (`npm run build`).

### 3.3 Adicionar variáveis de ambiente (Supabase)

Para o app funcionar em produção com o Supabase, adicione as mesmas variáveis que estão no seu `.env.local`:

1. Na tela de import/configure, expanda **"Environment Variables"**.
2. Adicione duas variáveis (use os valores do seu `.env.local` ou do painel do Supabase → Settings → API):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sua Project URL (ex.: `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua chave **anon public** |

3. Marque **Production**, **Preview** e **Development** para cada uma (ou pelo menos Production).
4. Clique em **"Deploy"**.

### 3.4 Aguardar o deploy

O Vercel vai clonar o repo, instalar dependências, rodar `npm run build` e publicar. Em 1–2 minutos você recebe um link do tipo:

`https://academia-nutricional-xxx.vercel.app`

Cada novo **push** na branch **main** no GitHub dispara um deploy automático.

### 3.5 Resumo Vercel

| O que fazer | Onde |
|-------------|------|
| Login / conta | vercel.com → Continue with GitHub |
| Importar projeto | Add New → Project → Import `vander-supa3/academia-nutricional` |
| Variáveis Supabase | Environment Variables na tela de deploy |
| Deploy automático | Todo push em `main` no GitHub |

---

## Resumo rápido

| O que fazer | Onde |
|------------|------|
| Repositório Git local | `git init` na pasta do projeto |
| Repositório remoto | GitHub → New repository |
| Ligar local ao remoto | `git remote add origin URL` + `git push -u origin main` |
| Projeto Supabase | supabase.com → New Project |
| URL e anon key | Supabase → Settings → API |
| Chaves no seu PC | Arquivo `.env.local` na raiz do projeto |
| Chaves no deploy | Variáveis de ambiente no Vercel (Environment Variables) |
| Deploy em produção | Vercel → Import repo GitHub → Configurar env → Deploy |

---

## Teste rápido (Supabase) — em 1 minuto

No **Supabase → SQL Editor**, rode:

```sql
select count(*) as recipes from public.recipes;
select count(*) as workouts from public.workouts;
select count(*) as exercises from public.workout_exercises;
```

- **recipes/workouts = 0** → rode `npm run seed:global` no projeto certo (`.env.local` com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do mesmo projeto).
- **"permission denied"** → RLS/policy: aplique `supabase/migrations/005_rls_public_and_auth_trigger.sql` (leitura pública em recipes/workouts + trigger de profile + policies).
- **"relation does not exist"** → aplique `supabase/schema.sql` e as migrations (002, 003, 004, 005).

---

## Arquivos do projeto relacionados

- **`.env.example`** — modelo das variáveis (sem valores reais); você copia para `.env.local` e preenche.
- **`lib/supabase.ts`** — cliente Supabase usado no app (lê `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **`lib/supabase-server.ts`** — cliente SSR para Route Handlers (cookies get/set/remove).

Se quiser, o próximo passo pode ser criar uma tabela no Supabase (ex.: usuários ou planos) e uma tela no Next.js que leia esses dados.
