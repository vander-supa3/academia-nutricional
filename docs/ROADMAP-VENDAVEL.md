# Roadmap — Academia Nutricional (App vendável R$ 19,90/mês)

Objetivo: levar o app a um estado **vendável**, com UI/UX de qualidade e **responsivo** (celular, tablet, PC), com **landing**, **logout** e **concordância** visual/funcional em todo o app.

---

## Visão geral

| Foco | Objetivo |
|------|----------|
| **Preço** | R$ 19,90/mês (BRL) |
| **Público** | Brasil, foco em quem quer consistência em treino + alimentação |
| **Diferencial** | Plano do dia, receitas, treinos guiados, assistente IA, offline, PWA |

---

## Estado atual (resumo)

- ✅ Login/cadastro, plano do dia, treinos, refeições, progresso, assistente IA, configurações (jejum), PWA, offline.
- ❌ **Sem landing** (hero + CTA “Entrar”): a home só redireciona para /login ou /hoje.
- ❌ **Sem logout**: usuário não consegue sair da conta pela interface.
- ❌ **Mobile-first** mas **pouco responsivo**: layout fixo `max-w-md`, nav só no rodapé; em tablet/PC fica estreito ou desperdiça espaço.
- ❌ **Concordância**: alguns cards/estados variam entre páginas; falta padrão único de seções e feedbacks.
- ❌ **Monetização**: nenhuma página de preço, assinatura ou checkout.

---

## Roadmap em 6 grupos de edição (por prompt)

Cada **grupo** pode ser pedido em **um prompt** (ou dois, se preferir dividir). A ordem sugere prioridade para “ficar vendável” rápido.

---

### **Grupo 1 — Landing + Logout + Home**  
*(1–2 prompts)*

**Objetivo:** Primeira impressão profissional e sair da conta.

| Item | O que fazer |
|------|-------------|
| **Landing (pública)** | Nova rota **`/`** (ou manter `/` e trocar lógica): **1 hero** (título, subtítulo, valor proposto) + **1 botão “Entrar”** (leva para `/login`). Sem redirecionar logado para /hoje aqui; quem está logado continua indo para /hoje pela home atual ou por um redirect separado. |
| **Home** | Se **não logado** → mostrar **landing**. Se **logado** → redirect para `/hoje`. (Ou: `/` sempre landing; “Entrar” → `/login`; após login → `/hoje`.) |
| **Logout** | **Botão/link “Sair”** em **Configurações** (e opcionalmente no header do AppShell). Ao clicar: `supabase.auth.signOut()` e redirect para `/` ou `/login`. Opcional: modal “Deseja sair?” antes de deslogar. |
| **Concordância** | Landing usar mesma paleta (primary, surface, ink) e fonte (Outfit) do app. |

**Arquivos tipicamente tocados:**  
`app/page.tsx`, nova `app/(marketing)/page.tsx` ou ajuste da home, `app/login/page.tsx` (só link “Voltar” se quiser), `components/AppShell.tsx` (link Sair no header ou só em Config), `app/(app)/configuracoes/page.tsx` (botão Sair).

**Sugestão de prompt:**  
*“Implementar: (1) Landing em `/` com 1 hero (título, subtítulo, CTA ‘Entrar’ para `/login`). (2) Se usuário já logado, redirecionar `/` para `/hoje`. (3) Botão ‘Sair’ em Configurações e opcionalmente no header; ao clicar, signOut e redirect para `/`. Usar mesma paleta e fonte do app.”*

---

### **Grupo 2 — Responsividade (tablet + PC)**  
*(1–2 prompts)*

**Objetivo:** Layout que use bem tablet e desktop, sem quebrar o que já funciona no celular.

| Item | O que fazer |
|------|-------------|
| **Breakpoints** | Usar Tailwind: `sm`, `md`, `lg`, `xl`. Conteúdo principal com `max-w` progressivo (ex.: `max-w-md` mobile, `md:max-w-2xl`, `xl:max-w-4xl`). |
| **AppShell** | **Mobile:** manter nav inferior. **Tablet/Desktop (md+):** nav lateral (sidebar) à esquerda com os mesmos links; header no topo; área de conteúdo à direita. Evitar nav fixa no rodapé em telas grandes. |
| **Main** | Padding e largura máxima responsivos; em desktop, conteúdo centralizado com colunas/grid onde fizer sentido (ex.: cards em 2 colunas em `lg`). |
| **Botão “Começar treino”** | Em desktop, posição que não cubra a nav lateral (ex.: dentro do conteúdo ou canto superior direito do header). |
| **Páginas** | Revisar Hoje, Treinos, Refeições, Progresso, Config, Assistente: garantir que cards e listas quebrem em 2 colunas em `lg` onde for natural. |

**Arquivos tipicamente tocados:**  
`components/AppShell.tsx`, `app/(app)/layout.tsx`, `tailwind.config.ts` (se precisar de tokens), cada página em `app/(app)/**/page.tsx` e componentes como `TodayPage`, `MealsPage`, etc.

**Sugestão de prompt:**  
*“Tornar o app responsivo para tablet e PC: em md+ usar sidebar à esquerda com os mesmos links da nav atual; header no topo; conteúdo com max-width progressivo (md:max-w-2xl, xl:max-w-4xl). Manter nav inferior só no mobile. Ajustar botão ‘Começar treino’ para desktop. Revisar páginas Hoje, Treinos, Refeições para layout em 2 colunas em telas grandes onde fizer sentido.”*

---

### **Grupo 3 — Concordância de UI/UX**  
*(1 prompt)*

**Objetivo:** Visual e comportamento iguais em todo o app.

| Item | O que fazer |
|------|-------------|
| **Cards** | Usar sempre `Card` + `CardBody`/`CardFooter`; mesmo `border`, `rounded`, `shadow`. |
| **Botões** | Primário: `Button` com variant primary; secundário: ghost. Mesmo tamanho e padding em formulários. |
| **Inputs** | Mesmo `rounded`, `border`, `focus:ring` em login, config, assistente. |
| **Títulos de seção** | Usar `SectionHeader` ou classe única (ex.: `text-lg font-semibold text-ink`) em todas as páginas. |
| **Loading** | Skeleton ou spinner único (ex.: mesmo componente em listas e detalhes). |
| **Erro/vazio** | Mensagem + botão “Tentar de novo” ou CTA padrão; estilo igual (ex.: card com borda suave e texto secundário). |
| **Avisos** | Jejum, saúde, offline: mesmo padrão (ex.: Badge + texto pequeno). |

**Arquivos tipicamente tocados:**  
`components/ui/*`, `TodayPage`, `MealsPage`, `WorkoutsPage`, `PreferenciasJejum`, `AiChat`, páginas de treino e progresso.

**Sugestão de prompt:**  
*“Padronizar UI em todo o app: usar sempre Card/CardBody/CardFooter nas seções; Button primary/ghost nos CTAs; inputs com mesma aparência; SectionHeader ou classe única para títulos; mesmo componente de loading e mesmo estilo de erro/vazio (mensagem + botão). Revisar Hoje, Treinos, Refeições, Config, Assistente, Progresso.”*

---

### **Grupo 4 — Página de preços e assinatura (R$ 19,90)**  
*(1–2 prompts)*

**Objetivo:** Explicitar valor e preço; preparar para cobrança.

| Item | O que fazer |
|------|-------------|
| **Página “Preços” ou “Planos”** | Rota pública (ex.: `/precos` ou `/planos`): título, benefícios (lista), **R$ 19,90/mês**, CTA “Assinar” ou “Começar”. Link no footer da landing e no login (“Ver planos”). |
| **Checkout** | Opção A: link para gateway externo (Mercado Pago, Stripe, Hotmart, etc.). Opção B: página interna “Checkout” que redireciona para o gateway. Não implementar processamento de cartão no app (usar gateway). |
| **Área logada** | Em Configurações: “Minha assinatura” (status: ativa/trial/cancelada) e link “Gerenciar” ou “Renovar”. Pode ser estático no início (só texto + link). |

**Arquivos tipicamente tocados:**  
Nova `app/(marketing)/precos/page.tsx` ou `app/precos/page.tsx`, `components/AppShell.tsx` ou landing (link Preços), `app/(app)/configuracoes/page.tsx` (bloco assinatura).

**Sugestão de prompt:**  
*“Criar página pública `/precos` com hero, lista de benefícios do app e preço R$ 19,90/mês com CTA ‘Assinar’ (por enquanto pode apontar para `/login?plano=mensal’ ou URL externa do gateway). Adicionar link ‘Ver planos’ na landing e no login. Em Configurações, adicionar seção ‘Minha assinatura’ com status e link ‘Gerenciar’.”*

---

### **Grupo 5 — Polish e confiança**  
*(1 prompt)*

**Objetivo:** Parecer produto final e dar segurança jurídica/institucional.

| Item | O que fazer |
|------|-------------|
| **Footer (landing)** | Links: Termos de Uso, Política de Privacidade, Contato (mailto ou link). |
| **Páginas legais** | Criar `/termos` e `/privacidade` (conteúdo placeholder ou texto básico). |
| **Contato** | Link “Fale conosco” (mailto ou formulário simples) no footer e/ou em Config. |
| **Meta e SEO** | Título e description por página (já existe no root); garantir que landing e preços tenham títulos e descrições adequados. |
| **Onboarding (opcional)** | Após primeiro login: 1 tela “Bem-vindo” com 2–3 bullets e “Ir para o app” (pode ser modal ou rota `/onboarding`). |

**Arquivos tipicamente tocados:**  
Landing, `app/layout.tsx`, novas rotas `app/termos/page.tsx`, `app/privacidade/page.tsx`, `app/contato/page.tsx` (opcional), componente ou página de onboarding.

**Sugestão de prompt:**  
*“Adicionar footer na landing com links Termos, Privacidade e Contato. Criar páginas estáticas `/termos` e `/privacidade` com conteúdo placeholder. Garantir meta title/description na landing e em /precos. Opcional: tela de boas-vindas após primeiro login com 2–3 benefícios e botão ‘Ir para o app’.”*

---

### **Grupo 6 — Monetização técnica (gateway)**  
*(1–2 prompts, quando definir o gateway)*

**Objetivo:** Conectar assinatura ao pagamento de verdade.

| Item | O que fazer |
|------|-------------|
| **Escolha do gateway** | Mercado Pago, Stripe, Hotmart, Iugu, etc. (definir um). |
| **Webhook** | Endpoint que recebe evento “assinatura paga” e atualiza perfil ou tabela `subscriptions` no Supabase. |
| **Tabela `subscriptions`** | Campos: `user_id`, `status`, `plan`, `current_period_end`, etc. |
| **Proteção de rotas** | Se quiser bloquear uso após fim do trial: middleware ou check no layout (app) que redireciona para /precos se `status !== 'active'`. |
| **Trial** | Opcional: 7 dias grátis; flag em `profiles` ou `subscriptions` (ex.: `trial_ends_at`). |

**Arquivos tipicamente tocados:**  
Nova migration (subscriptions), `app/api/webhooks/...`, lógica no layout ou middleware, página de preços (link para checkout do gateway).

**Sugestão de prompt:**  
*“Implementar suporte a assinatura: tabela subscriptions (user_id, status, plan, current_period_end); endpoint POST /api/webhooks/[gateway] para receber evento de pagamento; no app logado, checar status e redirecionar para /precos se inativo. Opcional: trial de 7 dias.”*  
*(Ajustar “[gateway]” e payload conforme a documentação do provedor escolhido.)*

---

## Resumo: quantidade de grupos e prompts

| Grupo | Conteúdo | Prompts sugeridos |
|-------|----------|--------------------|
| **1** | Landing (1 hero + Entrar) + Logout + Home | 1–2 |
| **2** | Responsividade (tablet + PC, sidebar, max-width) | 1–2 |
| **3** | Concordância UI/UX (cards, botões, loading, erros) | 1 |
| **4** | Página de preços (R$ 19,90) + “Minha assinatura” | 1–2 |
| **5** | Footer, termos, privacidade, contato, SEO, onboarding | 1 |
| **6** | Gateway, webhook, subscriptions, proteção de rota | 1–2 |

**Total estimado:** **6 a 10 prompts**, dependendo de quanto quiser dividir cada grupo.

Ordem recomendada para “ficar vendável” rápido: **1 → 2 → 3 → 4 → 5**, e **6** quando definir o gateway de pagamento.

---

## Checklist rápido (vendável)

- [ ] Landing com 1 hero e botão “Entrar”
- [ ] Logout visível (Config e/ou header)
- [ ] Home: não logado → landing; logado → /hoje
- [ ] Layout responsivo: sidebar em desktop, nav inferior em mobile
- [ ] Conteúdo com max-width progressivo em tablet/PC
- [ ] UI consistente (cards, botões, inputs, loading, erros)
- [ ] Página de preços com R$ 19,90/mês e CTA
- [ ] Footer com Termos, Privacidade, Contato
- [ ] Páginas /termos e /privacidade (mesmo que placeholder)
- [ ] “Minha assinatura” em Configurações
- [ ] (Opcional) Gateway + webhook + tabela subscriptions

---

## Próximo passo

Começar pelo **Grupo 1** (Landing + Logout + Home) em um único prompt e, em seguida, executar **Grupo 2** (Responsividade). Depois **Grupo 3** (Concordância), **4** (Preços) e **5** (Polish). Deixar **Grupo 6** para quando o gateway estiver definido.
