import { PreferenciasJejum } from "@/components/PreferenciasJejum";
import { SectionHeader } from "@/components/ui/SectionHeader";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configurações"
        subtitle="Preferências e avisos de segurança."
      />
      <PreferenciasJejum />
    </div>
  );
}
