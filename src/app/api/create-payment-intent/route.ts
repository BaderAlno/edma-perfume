import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { lookupPrice } from "@/lib/products";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
    }
    return new Stripe(key, { apiVersion: "2026-03-25.dahlia" as any });
}

interface IncomingItem {
    id: string;
    quantity: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { items: IncomingItem[], couponCode?: string };
        const items = body.items ?? [];
        const couponCode = body.couponCode;

        if (!items.length) {
            return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
        }

        let totalSAR = 0;

        const lineItems = items.map((item) => {
            const priceValue = lookupPrice(item.id);
            if (!priceValue) throw new Error(`Unknown product id: ${item.id}`);
            const qty = Math.max(1, Math.round(item.quantity));
            totalSAR += priceValue * qty;
            return { id: item.id, quantity: qty, priceValue };
        });

        let finalTotalSAR = totalSAR;
        let appliedCouponId: string | null = null;
        let discountAmountSAR = 0;

        if (couponCode) {
            const { data: coupon } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase().trim())
                .single();

            if (coupon && coupon.is_active && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) && (!coupon.max_uses || coupon.uses_count < coupon.max_uses)) {

                let discountableAmount = totalSAR;
                if (coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0) {
                    discountableAmount = lineItems
                        .filter(i => coupon.applicable_product_ids!.includes(i.id))
                        .reduce((sum, i) => sum + i.priceValue * i.quantity, 0);
                }

                if (!coupon.min_order || totalSAR >= Number(coupon.min_order)) {
                    if (coupon.type === 'percentage') {
                        discountAmountSAR = discountableAmount * (Number(coupon.value) / 100);
                    } else {
                        discountAmountSAR = Math.min(Number(coupon.value), discountableAmount);
                    }
                    finalTotalSAR = Math.max(0, totalSAR - discountAmountSAR);
                    appliedCouponId = coupon.id;
                }
            }
        }

        let totalHalalas = Math.round(finalTotalSAR * 100);

        if (totalHalalas < 100 && totalHalalas > 0) {
            totalHalalas = 100; // Stripe min 1 SAR if not free
        }

        if (totalHalalas === 0) {
            // Free order bypass
            return NextResponse.json({
                clientSecret: `pi_free_${Date.now()}_secret_bypass`,
                mock: true,
                free: true
            });
        }

        try {
            const stripe = getStripe();
            const paymentIntent = await stripe.paymentIntents.create({
                amount: totalHalalas,
                currency: "sar",
                automatic_payment_methods: { enabled: true },
                metadata: {
                    items: JSON.stringify(lineItems.map(i => ({ id: i.id, qty: i.quantity, price: i.priceValue }))),
                    coupon_code: couponCode || null,
                    coupon_id: appliedCouponId || null,
                    discount_amount: discountAmountSAR.toString()
                },
            });
            return NextResponse.json({ clientSecret: paymentIntent.client_secret });
        } catch (stripeErr) {
            console.warn("[create-payment-intent] Stripe unavailable — returning mock client secret for testing:", stripeErr instanceof Error ? stripeErr.message : stripeErr);
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
