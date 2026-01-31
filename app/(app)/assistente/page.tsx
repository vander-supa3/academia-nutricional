import { AiChat } from "@/components/AiChat";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function AssistentePage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assistente"
        subtitle="Pergunte sobre plano do dia, treinos, receitas e progresso. Respostas em tempo real."
      />
      <AiChat />
    </div>
  );
}
