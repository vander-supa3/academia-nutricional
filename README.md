# Academia Nutricional

Projeto web da **Academia Nutricional** — consistência diária, treino, refeições e bem-estar (MVP baseado no blueprint BemVida Fit).

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Banco)
- **React Query** (TanStack Query)
- **Sonner** (toasts)
- **PWA** (manifest + página /install)

## Como rodar

### 1. Supabase: criar tabelas

No painel do Supabase → **SQL Editor** → **New query**, cole e execute o conteúdo de:

```
supabase/schema.sql
```

Isso cria: `profiles`, `daily_plans`, `workouts`, `workout_exercises`, `recipes`, `plan_meals`, `daily_logs`, `challenges`, `challenge_members` e políticas RLS.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

- **NEXT_PUBLIC_SUPABASE_URL** e **NEXT_PUBLIC_SUPABASE_ANON_KEY** (obrigatório para o app).
- **SUPABASE_URL** e **SUPABASE_SERVICE_ROLE_KEY** (opcional; só para rodar o seed global). A service role está em Supabase → Settings → API → `service_role` (nunca commitar).

### 3. Seed global (30 treinos + 20 receitas)

Uma vez no projeto, rode:

```bash
npm run seed:global
```

Isso popula as tabelas `workouts`, `workout_exercises` e `recipes`. Se já houver 30+ treinos ou 20+ receitas, o script pula a inserção.

### 4. Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/login` ou `/hoje`.

### 5. Build

```bash
npm run build
npm start
```

## V2 (o que está pronto)

- **Login / cadastro** (Supabase Auth) em `/login`
- **Seed no 1º acesso**: ao entrar logado, o app cria 7 dias de plano + refeições + log do dia; botão "Gerar plano agora" na página Hoje se não houver plano
- **Hoje** (`/hoje`): plano do dia, refeições, água, progresso (streak) + toasts
- **Treinos** (`/treinos`): biblioteca com busca e filtro por foco; skeleton loading
- **Treinos/:id** (`/treinos/[id]`): detalhe do treino + lista de exercícios + botão "Começar treino"
- **Treino guiado** (`/treino-guiado/[id]`): timer por exercício (Play/Pause, Anterior/Próximo), barra de progresso; ao concluir marca `daily_logs.workout_done` e toast
- **Refeições** (`/refeicoes`): 20 receitas baratas com busca e filtro por tipo (Café, Almoço, Jantar, Lanche)
- **Progresso** (`/progresso`): streak, treinos feitos (14 dias), média de água, lista dos últimos 14 dias
- **Instalar** (`/install`): instruções PWA (Android + iOS)
- **Sonner** (toasts) + **React Query** (cache, retry, skeletons)

## Estrutura do projeto

```
academia-nutricional/
├── app/
│   ├── (app)/           # Área logada (AppShell + nav)
│   │   ├── hoje/        # Plano do dia
│   │   ├── treinos/         # Lista + /treinos/[id] detalhe
│   │   ├── treino-guiado/    # Redirect + /treino-guiado/[id] timer
│   │   ├── refeicoes/
│   │   ├── progresso/
│   │   └── install/
│   ├── login/
│   ├── layout.tsx
│   └── page.tsx         # Redireciona para /login ou /hoje
├── components/          # AppShell, TodayPage, InstallPage, etc.
├── lib/
│   ├── supabase.ts
│   ├── ensureSeed.ts    # Seed 7 dias + plan_meals + daily_logs
│   └── utils.ts
├── supabase/
│   └── schema.sql      # Tabelas + RLS (rodar no SQL Editor)
└── public/
    └── manifest.webmanifest
```

## Próximos passos

- Offline: localforage + fila de sync para logs (água, treino concluído)
- Gráfico de progresso (ex.: Chart.js ou CSS) na página Progresso
- ensureUserSeedV2: puxar receitas reais do Supabase para montar os 7 dias

---

Academia Nutricional — projeto em desenvolvimento.
