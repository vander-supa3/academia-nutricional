import { PreferenciasJejum } from "@/components/PreferenciasJejum";
import { LogoutButton } from "@/components/LogoutButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Link from "next/link";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Configurações"
        subtitle="Preferências e avisos de segurança."
      />
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium text-ink">Minha assinatura</div>
              <div className="text-sm text-zinc-500">Em breve</div>
            </div>
            <Link href="/precos" className="text-sm text-primary-600 hover:underline">Gerenciar</Link>
          </div>
        </CardBody>
      </Card>
      <PreferenciasJejum />
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-zinc-600">Sair da conta</span>
            <LogoutButton />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
