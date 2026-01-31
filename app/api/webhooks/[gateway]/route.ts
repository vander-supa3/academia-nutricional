import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Placeholder para webhooks de gateway (Stripe, Mercado Pago, Hotmart, etc.).
 * Quando escolher o gateway:
 * 1. Valide a assinatura do webhook com a chave do provedor.
 * 2. Identifique o user_id pelo payload (customer_id, payer_id, etc.).
 * 3. Atualize public.subscriptions (status, current_period_end, trial_ends_at).
 * 4. Logue o evento (tabela ou Sentry) para observabilidade.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ gateway: string }> }
) {
  const { gateway } = await params;

  try {
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Placeholder: apenas log e retorna 200
    console.log(`[webhook] ${gateway} received`, {
      contentType: headers["content-type"],
      bodyLength: body?.length ?? 0,
    });

    return NextResponse.json({ received: true, gateway });
  } catch (e) {
    console.error("[webhook] error", e);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
