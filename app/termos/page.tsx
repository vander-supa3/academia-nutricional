import Link from "next/link";

export const metadata = {
  title: "Termos de Uso | Academia Nutricional",
  description: "Termos de uso do serviço Academia Nutricional.",
};

export default function TermosPage() {
  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-ink">Termos de Uso</h1>
        <p className="mt-2 text-sm text-zinc-500">Última atualização: 2025.</p>
        <div className="mt-8 prose prose-zinc max-w-none text-sm text-zinc-700 space-y-4">
          <p>
            Ao usar o Academia Nutricional você concorda com estes termos. O serviço oferece
            planejamento de treinos e refeições, assistente com IA e uso offline. O app não
            substitui orientação médica ou nutricional — consulte um profissional de saúde.
          </p>
          <p>
            Você é responsável por manter a confidencialidade da sua conta e por todas as
            atividades realizadas nela. Não use o serviço para fins ilegais ou que violem
            direitos de terceiros.
          </p>
          <p>
            Podemos alterar estes termos com aviso prévio. O uso continuado após as alterações
            constitui aceitação. Em caso de dúvidas, entre em contato.
          </p>
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-sm text-primary-600 hover:underline"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
