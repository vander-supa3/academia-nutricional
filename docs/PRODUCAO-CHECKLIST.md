# Academia Nutricional — Checklist para Produção

Checklist opinativo em 3 fases (MVP → Beta → Produção) com decisões recomendadas e ordem de execução.

---

## Índice

1. [Infra / Deploy](#1-infra--deploy)
2. [Supabase em produção](#2-supabase-em-produção)
3. [Seeds](#3-seeds)
4. [IA (Assistants / Tools)](#4-ia-assistants--tools)
5. [Offline](#5-offline)
6. [Auth e sessões](#6-auth-e-sessões)
7. [Observabilidade](#7-observabilidade)
8. [Compliance / UX](#8-compliance--ux)
9. [Plano em 3 fases](#9-plano-em-3-fases)

---

## 1. Infra / Deploy

### Decisão recomendada: Vercel + domínio próprio + next-pwa só em produção

| Item | Recomendação | Ação |
|------|--------------|------|
| Host | **Vercel** (já integrado ao GitHub) | Conectar repo `vander-supa3/academia-nutricional` |
| Domínio | Custom (ex.: `app.academianutricional.com.br`) | Vercel → Settings → Domains → Add |
| HTTPS | Automático na Vercel | Nada a fazer |
| Security headers | Next.js `headers()` + Vercel | Ver trecho abaixo |
| Cache/CDN | Vercel Edge + `stale-while-revalidate` para estáticos | Config no `next.config.js` |
| next-pwa | **Só em produção** (`disable: process.env.NODE_ENV === 'development'`) | Já está assim no projeto |
| Build | `npm run build`; variáveis de ambiente no Vercel | Env Vars: `NEXT_PUBLIC_SUPABASE_*` |

### 1.1 Security headers (Next.js 14)

Criar ou editar **`app/headers.ts`** (ou usar `next.config.js` headers):

```ts
// app/headers.ts (Next.js 14)
import type { NextRequest } from "next/server";

export function headers(request: NextRequest) {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
}
```

Ou em **`next.config.js`**:

```js
// dentro de nextConfig:
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ];
}
```

### 1.2 Ordem de execução (Deploy)

1. Garantir que `npm run build` passa localmente.
2. Vercel: Import project from GitHub → selecionar repo.
3. Configurar Environment Variables (Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Depois: Domains → adicionar domínio custom e seguir DNS.
5. (Opcional) Adicionar `headers()` ou `async headers()` no `next.config.js` e redeployar.

---

## 2. Supabase em produção

### Decisão recomendada: RLS em tudo que for por usuário; índices em FKs e filtros; schema versionado em arquivos SQL.

### 2.1 RLS — políticas finais (resumo)

- **profiles**: usuário só lê/atualiza o próprio (`auth.uid() = id`).
- **daily_plans**: usuário só acessa onde `user_id = auth.uid()`.
- **plan_meals**: só acessa se o `daily_plan` pertencer ao usuário (via `exists` em `daily_plans`).
- **daily_logs**: só acessa onde `user_id = auth.uid()`.
- **workouts / workout_exercises / recipes**: sem RLS (leitura pública).

### 2.2 Índices recomendados

Rodar no **SQL Editor** do Supabase (após o schema inicial):

```sql
-- performance em queries por usuário e data
CREATE INDEX IF NOT EXISTS idx_daily_plans_user_day
  ON public.daily_plans (user_id, day_index);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date
  ON public.daily_logs (user_id, date);

CREATE INDEX IF NOT EXISTS idx_plan_meals_plan
  ON public.plan_meals (plan_id);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout
  ON public.workout_exercises (workout_id);
```

### 2.3 Constraints e dados órfãos

- Já existem FKs com `ON DELETE CASCADE` em `daily_plans` → `profiles`, `plan_meals` → `daily_plans`, `daily_logs` → `profiles`.
- Garantir constraint única em `daily_logs(user_id, date)` (já existe no schema).
- Nenhuma tabela crítica deve aceitar `user_id` NULL onde for obrigatório.

### 2.4 Backups e migrações

- **Backups**: usar backups automáticos do Supabase (plano) ou pg_dump agendado.
- **Versionar schema**: manter em repo pastas como `supabase/migrations/` com arquivos numerados, ex.:
  - `001_initial_schema.sql` (schema atual)
  - `002_add_indexes.sql` (índices acima)
- Rodar migrações manualmente no SQL Editor ou via Supabase CLI (`supabase db push`) quando adotar CLI.

### 2.5 Ordem de execução (Supabase)

1. Rodar `supabase/schema.sql` (se ainda não rodou).
2. Rodar o bloco de `CREATE INDEX IF NOT EXISTS` acima.
3. Criar `supabase/migrations/002_add_indexes.sql` com os índices e commitar.
4. Configurar backups no painel do Supabase (se disponível no plano).

---

## 3. Seeds

### Decisão recomendada: seed global manual ou em CI com SERVICE_ROLE; idempotência por contagem; evoluir biblioteca em novos scripts, sem apagar dados do usuário.

| Pergunta | Resposta |
|----------|----------|
| Onde rodar? | Local ou CI (GitHub Actions) com env vars injetadas (SERVICE_ROLE nunca no front). |
| Duplicidade? | Script já verifica `count` de `workouts` e `recipes`; se ≥ 30 / ≥ 20, pula insert. |
| Atualizações futuras? | Novos scripts (ex.: `003_seed_workouts_v2.sql` ou `scripts/seedGlobalV2.ts`) que adicionam/atualizam por critério (ex.: título), sem `DELETE` em tabelas que tenham dados do usuário. |

### 3.1 Rodar seed global com segurança

- **Local**: usar `.env.local` com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`; nunca commitar.
- **CI (GitHub Actions)**:
  - Repo → Settings → Secrets and variables → Actions.
  - Criar secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Workflow exemplo (disparo manual ou em release):

```yaml
# .github/workflows/seed-global.yml
name: Seed Global
on:
  workflow_dispatch:
jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run seed:global
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### 3.2 Evitar duplicidade

- No `scripts/seedGlobal.ts` manter a lógica atual: `count` de `workouts` e `recipes`; se já tiver 30+ / 20+, não inserir de novo.
- Para “atualizar” biblioteca no futuro: criar script que faz `INSERT ... ON CONFLICT DO UPDATE` ou que insere só itens novos (ex.: por `title` ou por slug), sem truncar tabelas ligadas a usuário.

### 3.3 Ordem de execução (Seeds)

1. Garantir que `npm run seed:global` roda local com `.env.local` (SERVICE_ROLE).
2. (Opcional) Adicionar `.github/workflows/seed-global.yml` e secrets no GitHub.
3. Documentar no README: “Seed global: rodar uma vez após criar tabelas; para atualizar biblioteca, usar script X”.

---

## 4. IA (Assistants / Tools)

### Decisão recomendada: 1 agente orquestrador; API route POST /api/ai/run; streaming (SSE); timeouts e rate limit; fila/retries no cliente para não travar a UI.

| Tópico | Recomendação |
|--------|--------------|
| Arquitetura | Um agente “orquestrador” que decide chamadas e tools. |
| Endpoint | `POST /api/ai/run` (body: mensagem, contexto, tool_choice). |
| requires_action | Tratar no mesmo request: chamar tools, reenviar resultado ao provider até não haver mais tool calls. |
| Timeouts | Timeout de request grande (ex.: 60–120 s) no server; timeout menor no cliente (ex.: 90 s) com retry. |
| Rate limiting | Por usuário/sessão (ex.: 20 req/min) em middleware ou no route handler. |
| Custos | Logar tokens por request; alertas se passar de X requests/dia. |
| UI não travar | Cliente usa **streaming (SSE)** para texto; chamadas de tool são “turnos” no server; cliente só mostra loading por turno e faz retry com backoff. |

### 4.1 Esboço de API route (Next.js 14)

```ts
// app/api/ai/run/route.ts
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Vercel Pro: 60s

export async function POST(req: NextRequest) {
  const userId = (await getUserIdFromSession(req)); // sua lógica de auth
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // rate limit aqui (ex.: por userId)
  const body = await req.json();
  const stream = await runAgentStream(body); // sua função que chama OpenAI etc e trata tool_calls
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```

- `runAgentStream`: enquanto o modelo devolver `tool_calls`, executar as tools e reenviar o resultado no mesmo fluxo; emitir eventos SSE para o cliente.
- Cliente: `EventSource` ou `fetch` com `ReadableStream`; atualizar UI a cada chunk; em caso de timeout, retry com backoff.

### 4.2 Ordem de execução (IA)

1. Definir contrato do body de `POST /api/ai/run` e formato do SSE.
2. Implementar `runAgentStream` (provider + loop de tool_calls).
3. Adicionar auth e rate limit no route.
4. Cliente: consumir SSE e retry; não bloquear UI (loading por “turno”).

---

## 5. Offline

### Decisão recomendada: fila local (localforage) + sync ao voltar online; last-write-wins por (user_id, date) em daily_logs; sem merge complexo para MVP.

| Tópico | Recomendação |
|--------|--------------|
| Estratégia | Queue de mutações (ex.: UPSERT_DAILY_LOG); ao ficar online, aplicar em ordem e remover da fila. |
| Conflitos | **Last-write-wins** por `(user_id, date)`: cada sync envia o payload da fila; o último upsert “ganha”. Para MVP, sem resolução por campo. |
| Integridade | Supabase upsert com `onConflict: 'user_id,date'`; transação implícita por linha. |
| Testar | DevTools → Network → Offline; executar ações (água, treino); voltar online e checar toast + dados no Supabase. |

### 5.1 Garantir integridade ao voltar online

- Ao sincronizar, processar a fila em ordem (por `createdAt`).
- Para cada item `UPSERT_DAILY_LOG`, fazer um único `upsert` com todos os campos enviados (water_ml, workout_done, etc.); não fazer “patch” parcial sem ler antes se quiser evitar sobrescrever acidentalmente (para MVP, sobrescrever está ok).
- Só remover da fila após resposta 2xx do Supabase.

### 5.2 Ordem de execução (Offline)

1. Manter `syncOfflineQueue` e `useAutoSync` como estão.
2. Testar manualmente: modo avião → ações → voltar → checar dashboard Supabase.
3. (Opcional) Adicionar log de “sync failed” para Sentry/observabilidade.

---

## 6. Auth e sessões

### Decisão recomendada: Supabase Auth com cookies (server-side) para proteger rotas; redirecionar anônimos para /login; não expor dados de outros usuários (RLS já cobre).

| Tópico | Recomendação |
|--------|--------------|
| Redirecionamento | Se não houver sessão, redirecionar para `/login` (já feito no layout da área logada). |
| Cookies | Usar `@supabase/ssr` e middleware para refrescar sessão e definir cookies; no App Router, criar `createServerClient` em middleware e em Server Components quando necessário. |
| Proteção de rotas | Todas as rotas sob `(app)` já verificam sessão no layout e redirecionam; manter essa lógica. |
| Evitar leaks | RLS garante que cada usuário só vê seus dados; nunca confiar só no front: sempre validar no backend (e RLS é o “backend” do Supabase). |

### 6.1 Middleware (Supabase SSR) — opcional para refresh de sessão

```ts
// middleware.ts (raiz do projeto)
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => cookies.forEach((c) => res.cookies.set(c.name, c.value, c.options)),
      },
    }
  );
  await supabase.auth.getUser();
  return res;
}

export const config = { matcher: ["/((?!_next|api|favicon.ico).*)"] };
```

- Instalar `@supabase/ssr` e usar esse middleware para que a sessão seja renovada em toda navegação e os cookies fiquem corretos para o server.

### 6.2 Ordem de execução (Auth)

1. Manter redirecionamento para `/login` no layout `(app)`.
2. (Opcional) Adicionar `middleware.ts` com `@supabase/ssr` e testar refresh de sessão.
3. Revisar que nenhuma API ou Server Component expõe dados sem checar `auth.uid()` (e que RLS está ativo nas tabelas sensíveis).

---

## 7. Observabilidade

### Decisão recomendada: Sentry para erros; Vercel Analytics (opcional); logs estruturados em /api; alertas para falhas de sync e erros 5xx.

| Tópico | Recomendação |
|--------|--------------|
| Erros front/back | **Sentry** (Next.js): `@sentry/nextjs`; capturar exceções e rejeições. |
| Logs | Em `syncOfflineQueue` e em `/api/*`: logar com nível (info/error) e contexto (userId, synced count, error message). |
| Tracing | Sentry transactions para requests críticos (ex.: sync, /api/ai/run). |
| Métricas | Vercel Analytics ou Sentry; contagem de syncs falhos e de erros 5xx. |
| Alertas | Sentry: alerta para erro rate alto; (opcional) Logflare/Datadog para logs de sync. |
| Debugar sync/IA | Logs com `userId`, `synced`, `error`; em produção, buscar por “sync” ou “ai/run” no Sentry. |

### 7.1 Sentry (exemplo mínimo)

```bash
npx @sentry/wizard@latest -i nextjs
```

- Seguir o wizard; em `sentry.client.config.ts` e `sentry.server.config.ts` manter DSN e environment (ex.: production).
- Em `syncOfflineQueue`: em catch, `Sentry.captureException(e)` com tags `{ feature: 'offline-sync' }`.

### 7.2 Ordem de execução (Observabilidade)

1. Configurar Sentry para o projeto Next.js.
2. Adicionar `Sentry.captureException` no catch de `syncOfflineQueue` e nas API routes de IA.
3. Definir alertas no Sentry (ex.: mais de N erros em 1 h).
4. (Opcional) Ativar Vercel Analytics.

---

## 8. Compliance / UX

| Item | Recomendação |
|------|--------------|
| Textos | Tudo em **PT-BR** (já é o caso). |
| Disclaimers de saúde | Texto visível (ex.: no rodapé ou na tela “Progresso”): “Este app não substitui orientação médica ou nutricional. Consulte um profissional de saúde.” |
| Acessibilidade | Contraste adequado (já com Tailwind); labels em inputs; `aria-hidden` em decorações; botões e links focáveis. |
| Performance mobile | Otimizar imagens (next/image); evitar JS pesado acima da dobra; testar **Lighthouse** (Performance, A11y) em mobile. |

### 8.1 Disclaimer de saúde (exemplo)

No **AppShell** (footer) ou na página **Progresso**:

```tsx
<p className="text-xs text-zinc-500 italic">
  Este app não substitui orientação médica ou nutricional. Consulte um profissional de saúde.
</p>
```

### 8.2 Ordem de execução (Compliance/UX)

1. Revisar todas as strings na UI para PT-BR.
2. Incluir disclaimer de saúde no app (rodapé ou Progresso).
3. Rodar Lighthouse (mobile) e corrigir itens críticos (contraste, labels, tamanho de alvo).
4. (Opcional) Adicionar `aria-label` em ícones e botões só com ícone.

---

## 9. Plano em 3 fases

### Fase 1 — MVP (Definition of Done)

- [ ] Deploy na Vercel com variáveis de ambiente.
- [ ] Schema + índices no Supabase rodados; RLS ativo.
- [ ] Seed global rodado (30 treinos, 20 receitas).
- [ ] Login/cadastro funcionando; redirecionamento para `/login` quando não autenticado.
- [ ] Fluxo Hoje + Treinos + Refeições + Progresso + Install sem erro em produção.
- [ ] Offline: água e “treino concluído” enfileiram e sincronizam ao voltar online.
- [ ] Security headers aplicados.
- [ ] Disclaimer de saúde visível.

**Comandos/configs:**

```bash
# Build local
npm run build

# Seed (local, uma vez)
# .env.local com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
npm run seed:global
```

- Vercel: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Supabase: executar `supabase/schema.sql` e depois o bloco de índices (seção 2.2).

---

### Fase 2 — Beta

- [ ] Domínio custom configurado (ex.: app.seudominio.com.br).
- [ ] Sentry instalado e capturando erros; pelo menos um alerta configurado.
- [ ] Middleware de auth (Supabase SSR) ativo para refresh de sessão.
- [ ] Testes manuais de offline documentados (passo a passo).
- [ ] Lighthouse mobile: Performance e A11y sem itens “vermelhos” críticos.
- [ ] (Opcional) Workflow de seed global no GitHub Actions.

**Comandos/configs:**

```bash
npx @sentry/wizard@latest -i nextjs
```

- Adicionar `middleware.ts` com `createServerClient` (Supabase SSR).
- Vercel: adicionar domínio em Settings → Domains.

---

### Fase 3 — Produção

- [ ] IA (se aplicável): `POST /api/ai/run` com streaming, timeout, rate limit e logs.
- [ ] Backups do Supabase verificados (agendados ou manuais).
- [ ] Migrações de schema versionadas em `supabase/migrations/`.
- [ ] Política de atualização de seeds documentada (como adicionar treinos/receitas sem apagar dados do usuário).
- [ ] Revisão final de compliance (disclaimer, PT-BR, acessibilidade).
- [ ] Plano de resposta a incidentes (quem verifica Sentry, como reverter deploy).

**Comandos/configs:**

- Manter `maxDuration` e timeouts alinhados entre Vercel e chamadas de IA.
- Documentar no README: “Produção: URL do app, variáveis necessárias, como rodar seed e migrações”.

---

## Ordem de execução geral (passo a passo)

1. **Schema e índices** — Rodar `supabase/schema.sql` e o bloco de índices no Supabase.
2. **Seed global** — Rodar `npm run seed:global` uma vez (local ou CI).
3. **Build** — `npm run build`; corrigir erros se houver.
4. **Vercel** — Conectar repo, configurar env vars, deploy.
5. **Headers** — Adicionar security headers no `next.config.js` (ou `headers.ts`) e redeployar.
6. **Disclaimer** — Adicionar texto de saúde no app.
7. **Sentry** — Instalar e configurar; adicionar capture em sync e em APIs críticas.
8. **(Beta)** Domínio custom e middleware de auth.
9. **(Produção)** IA, backups e migrações versionadas conforme seção 4 e 2.4.

---

*Documento vivo: atualizar conforme o app ganhar novas features (IA, mais seeds, etc.).*
