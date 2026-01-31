# Assistente OpenAI — Tools e prompts

Configuração do Assistente no **OpenAI Dashboard** (Assistants → seu assistente).

---

## Etapa 2 — Adicionar as 4 tools no Assistente

No Assistente, em **Tools** → **Function** → adicione as functions com estes nomes e parâmetros:

### get_today

```json
{
  "name": "get_today",
  "description": "Busca plano do dia, refeições e log do usuário.",
  "parameters": {
    "type": "object",
    "properties": {
      "date": { "type": "string", "description": "yyyy-mm-dd (opcional)" }
    }
  }
}
```

### generate_week_plan

```json
{
  "name": "generate_week_plan",
  "description": "Gera 7 dias de plano usando treinos e receitas do banco. Se force=true recria.",
  "parameters": {
    "type": "object",
    "properties": {
      "force": { "type": "boolean" }
    }
  }
}
```

### log_water

```json
{
  "name": "log_water",
  "description": "Atualiza água do dia (ml) no daily_logs do usuário.",
  "parameters": {
    "type": "object",
    "properties": {
      "date": { "type": "string", "description": "yyyy-mm-dd" },
      "waterMl": { "type": "number" }
    },
    "required": ["date", "waterMl"]
  }
}
```

### complete_workout

```json
{
  "name": "complete_workout",
  "description": "Marca treino como concluído no daily_logs do dia.",
  "parameters": {
    "type": "object",
    "properties": {
      "date": { "type": "string", "description": "yyyy-mm-dd" },
      "workoutId": { "type": "string", "description": "Opcional" }
    },
    "required": ["date"]
  }
}
```

Mantenha também as tools já existentes: `search_recipes`, `search_workouts`, `get_workout`, `get_progress_summary`.

---

## Etapa 3 — System Instructions do Assistente

Em **Instructions**, acrescente (ou use como base):

```
Quando o usuário pedir qualquer ação do app:
1) Chame a tool apropriada antes de responder.
2) Se faltar dados do dia, chame get_today.
3) Se não houver plano da semana, ofereça generate_week_plan.
4) Para água e treino, use log_water e complete_workout.
Nunca invente dados do banco.
```

---

## Etapa 4 — Resolver “sem informações” no localhost

| Mensagem / causa | O que fazer |
|------------------|-------------|
| `relation "recipes" does not exist` | Aplicar `supabase/schema.sql` e migrations no Supabase correto. |
| `permission denied for table recipes` | RLS sem policy. Em `recipes`/`workouts` (públicas), desabilite RLS ou crie policy de leitura pública. |
| `JWT expired` ou `Invalid JWT` | Sessão/cookies não lidos no server. Revisar `createClient()` em `lib/supabase-server.ts` e cookies no request. |
| Receitas vazias / “Erro ao carregar” | Rodar `npm run seed:global` com `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do mesmo projeto no `.env.local`. |

O erro real aparece no console (F12) e na caixa “Causa: …” na tela de Refeições.
