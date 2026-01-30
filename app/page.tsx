export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Hero */}
      <header className="container mx-auto px-4 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-900/30 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500"></span>
          </span>
          Em breve
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Academia
          <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            {" "}
            Nutricional
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Sua jornada para uma alimentação mais saudável começa aqui. Aprenda,
          planeje e transforme seus hábitos com conhecimento e prática.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#"
            className="rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Quero começar
          </a>
          <a
            href="#"
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Saiba mais
          </a>
        </div>
      </header>

      {/* Features preview */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Planos alimentares",
              description:
                "Receba orientações personalizadas e cardápios adaptados ao seu objetivo.",
              icon: "🥗",
            },
            {
              title: "Acompanhamento",
              description:
                "Registre refeições e evolução com ferramentas simples e objetivas.",
              icon: "📊",
            },
            {
              title: "Conteúdo e cursos",
              description:
                "Aprenda nutrição na prática com materiais e trilhas de estudo.",
              icon: "📚",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50"
            >
              <span className="text-3xl" role="img" aria-hidden>
                {item.icon}
              </span>
              <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 dark:border-slate-700">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Academia Nutricional — projeto em desenvolvimento
        </div>
      </footer>
    </main>
  );
}
