# Passo a passo: Git e Supabase

Guia para conectar o projeto **Academia Nutricional** ao Git (GitHub/GitLab) e ao Supabase.

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

### 2.4 Configurar variáveis no GitHub (quando usar CI/deploy)

Se for usar GitHub Actions ou deploy (ex.: Vercel):

1. No repositório no GitHub: **Settings** → **Secrets and variables** → **Actions** (ou **Environments** no Vercel).
2. Crie os **secrets** (ou variáveis):
   - `NEXT_PUBLIC_SUPABASE_URL` = sua Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key.

Assim o código não fica com as chaves no repositório.

### 2.5 Testar a conexão

Com o `.env.local` preenchido:

```bash
npm run dev
```

O app já está configurado para usar o cliente Supabase. Quando você criar telas que usem `createBrowserClient()` (ou o helper do projeto), a conexão será feita automaticamente com essas variáveis.

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
| Chaves no deploy | GitHub Secrets / Variáveis do Vercel (ou outro) |

---

## Arquivos do projeto relacionados

- **`.env.example`** — modelo das variáveis (sem valores reais); você copia para `.env.local` e preenche.
- **`lib/supabase.ts`** — cliente Supabase usado no app (lê `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

Se quiser, o próximo passo pode ser criar uma tabela no Supabase (ex.: usuários ou planos) e uma tela no Next.js que leia esses dados.
