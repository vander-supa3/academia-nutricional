"use client";

import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";

const WHATSAPP_NUMBER = "5511999999999";
const WHATSAPP_MSG = "Olá! Gostaria de agendar uma consulta individual com a nutricionista.";

export default function ConsultaPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/progresso"
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-ink"
      >
        <ArrowLeft size={18} />
        Voltar ao Progresso
      </Link>

      <div className="border border-border rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 text-primary-700 font-semibold text-lg">
          <MessageCircle size={24} />
          Consulta individual com a Nutricionista
        </div>
        <p className="mt-3 text-zinc-600">
          Este é um <strong>serviço premium</strong>, separado do app. O Academia Nutricional é
          automatizado e oferece planos baseados em templates e seu perfil alimentar — não substitui
          uma consulta presencial ou online com um profissional.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600 list-disc list-inside">
          <li>Atendimento individual (valor à parte)</li>
          <li>Agendamento pelo WhatsApp</li>
          <li>Consulta presencial ou online, conforme combinação</li>
        </ul>
        <div className="mt-6">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 text-sm font-medium hover:bg-green-700 transition"
          >
            Agendar pelo WhatsApp
          </a>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        O app é automatizado e não substitui consulta individual. Para dúvidas sobre o plano ou
        condições, entre em contato pelo link acima.
      </p>
    </div>
  );
}
