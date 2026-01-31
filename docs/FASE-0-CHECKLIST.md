# Fase 0 — Confirmação de base (pré-requisito antes de mexer em UI)

Valide que o Supabase e o app estão OK antes de seguir para Landing/Logout/Responsividade.

---

## 1. Supabase: tabelas existem

No **Supabase → Table Editor** (ou SQL Editor), confirme:

| Tabela | Existe? |
|--------|--------|
| `profiles` | ☐ |
| `daily_plans` | ☐ |
| `plan_meals` | ☐ |
| `daily_logs` | ☐ |
| `recipes` | ☐ |
| `workouts` | ☐ |
| `workout_exercises` | ☐ |
| `ai_threads` | ☐ |

**RLS:** leitura pública para `recipes`, `workouts`, `workout_exercises`; dados do usuário protegidos (profiles, daily_plans, daily_logs, plan_meals, ai_threads).

---

## 2. Seed global

No terminal, na pasta do projeto:

```bash
npm run seed:global
```

Requisito: no `.env.local` deve ter `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do **mesmo** projeto.

Depois, no **SQL Editor**:

```sql
select (select count(*) from public.recipes) as recipes,
       (select count(*) from public.workouts) as workouts,
       (select count(*) from public.workout_exercises) as exercises;
```

| Campo | Esperado |
|-------|----------|
| recipes | ≥ 20 |
| workouts | ≥ 30 |
| exercises | ≥ 120 |

---

## 3. App local: telas e fluxos

Com `npm run dev` e usuário logado:

| Tela / Ação | Esperado |
|-------------|----------|
| `/treinos` | Carrega lista (sem erro de permissão ou “relation does not exist”). |
| `/refeicoes` | Carrega receitas (sem erro). |
| `/hoje` → “Gerar plano agora” | Cria 7 dias + refeições (daily_plans + plan_meals). |
| `/configuracoes` → Salvar jejum | Salva sem 401. |
| `/assistente` → enviar mensagem | Resposta via SSE (não trava). |

---

## DoD Fase 0

- [ ] Todas as tabelas listadas existem no projeto correto.
- [ ] RLS aplicado (público para recipes/workouts/workout_exercises; resto protegido).
- [ ] `npm run seed:global` rodou com sucesso; recipes ≥ 20, workouts ≥ 30, workout_exercises ≥ 120.
- [ ] `/treinos` e `/refeicoes` carregam dados reais sem erro.
- [ ] `/hoje` “Gerar plano agora” cria 7 dias + refeições.
- [ ] `/configuracoes` salva preferências de jejum (sem 401).
- [ ] `/assistente` responde via SSE sem travar.

**Quando tudo estiver marcado:** base OK para seguir para Grupo 1 (Landing + Logout + Home).
