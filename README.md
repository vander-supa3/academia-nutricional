# Academia Nutricional

Projeto web da **Academia Nutricional** — plataforma para jornada de alimentação mais saudável.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

## Como rodar

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Subir o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### Build para produção

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Estrutura do projeto

```
academia-nutricional/
├── app/
│   ├── layout.tsx    # Layout raiz e metadados
│   ├── page.tsx      # Página inicial
│   └── globals.css   # Estilos globais
├── public/           # Arquivos estáticos (criar conforme necessário)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Próximos passos sugeridos

- [ ] Páginas: login, cadastro, dashboard
- [ ] Autenticação (ex.: NextAuth.js)
- [ ] Banco de dados (ex.: Prisma + PostgreSQL)
- [ ] API de planos alimentares e acompanhamento
- [ ] Área de conteúdo/cursos

---

Academia Nutricional — projeto em desenvolvimento.
