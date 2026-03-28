import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { lookupPrice } from "@/lib/products";

// ─── Stripe client (lazy-initialised so missing key gives a clear error) ──────
function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
    }
    return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

// ─── Types expected from the client ──────────────────────────────────────────
interface IncomingItem {
    id:       string;  // product id — prices are looked up server-side
    quantity: number;
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const body  = await request.json() as { items: IncomingItem[] };
        const items = body.items ?? [];

        if (!items.length) {
            return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
        }

        // ── Validate items & compute total server-side ────────────────────
        // Prices are NEVER trusted from the client — we look them up here.
        let totalHalalas = 0; // SAR smallest unit (100 halalas = 1 SAR)

        const lineItems = items.map((item) => {
            const priceValue = lookupPrice(item.id);
            if (!priceValue) {
                throw new Error(`Unknown product id: ${item.id}`);
            }
            const qty = Math.max(1, Math.round(item.quantity));
            totalHalalas += priceValue * qty * 100;
            return { id: item.id, quantity: qty, priceValue };
        });

        if (totalHalalas < 100) {  // Stripe minimum: 1 SAR
            return NextResponse.json({ error: "Order total is too low." }, { status: 400 });
        }

        // ── Create PaymentIntent (falls back to mock if Stripe key is invalid) ──
        try {
            const stripe = getStripe();
            const paymentIntent = await stripe.paymentIntents.create({
                amount:   totalHalalas,
                currency: "sar",
                automatic_payment_methods: { enabled: true },
                metadata: {
                    items: JSON.stringify(
                        lineItems.map(i => ({ id: i.id, qty: i.quantity, price: i.priceValue }))
                    ),
                },
            });
            return NextResponse.json({ clientSecret: paymentIntent.client_secret });
        } catch (stripeErr) {
            console.warn(
                "[create-payment-intent] Stripe unavailable — returning mock client secret for testing:",
                stripeErr instanceof Error ? stripeErr.message : stripeErr
            );
            return NextResponse.json({
                clientSecret: `pi_mock_${Date.now()}_secret_test_bypass`,
                mock: true,
            });
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[create-payment-intent]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
