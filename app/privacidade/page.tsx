import Link from "next/link";

export const metadata = {
  title: "Privacidade | Academia Nutricional",
  description: "Política de privacidade do Academia Nutricional.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-ink">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-zinc-500">Última atualização: 2025.</p>
        <div className="mt-8 prose prose-zinc max-w-none text-sm text-zinc-700 space-y-4">
          <p>
            O Academia Nutricional coleta apenas os dados necessários para o funcionamento do
            serviço: e-mail e senha (autenticação), dados de perfil e logs de uso (plano do dia,
            água, treinos) armazenados de forma segura.
          </p>
          <p>
            Não vendemos seus dados. Usamos os dados para fornecer o serviço, melhorar a
            experiência e cumprir obrigações legais. Dados podem ser processados em servidores
            (incluindo Supabase) em conformidade com boas práticas de segurança.
          </p>
          <p>
            Você pode solicitar exclusão da conta e dos dados associados entrando em contato.
            Ao usar o app você concorda com esta política.
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
