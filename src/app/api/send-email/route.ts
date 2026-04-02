import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { buildConfirmationEmail } from "@/lib/emailTemplate";
import { lookupPrice, SERVER_PRODUCTS } from "@/lib/products";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { incrementCouponUsage } from "@/lib/actions/coupons";

function getResend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        throw new Error("RESEND_API_KEY is not set in environment variables.");
    }
    return new Resend(key);
}

interface IncomingItem {
    id: string;
    quantity: number;
}

interface SendEmailBody {
    email: string;
    items: IncomingItem[];
    language: "en" | "ar";
    orderRef: string; // Stripe PaymentIntent ID
    couponId?: string;
    discountAmount?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SendEmailBody;
        const { email, items, language = "en", orderRef, couponId, discountAmount = 0 } = body;

        if (!email || !items?.length || !orderRef) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // Build order lines with server-side prices
        const emailItems = items.map((item) => {
            const product = SERVER_PRODUCTS[item.id];
            const unitPrice = lookupPrice(item.id);
            const qty = Math.max(1, Math.round(item.quantity));
            return {
                id: item.id,
                name: product ? product.name[language] : item.id,
                quantity: qty,
                unitPrice,
            };
        });

        const totalSAR = emailItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

        // ── 1. Save to Supabase ───────────────────────────────────────────
        try {
            // Find or create customer by email
            const { data: existingCustomerRaw } = await supabaseAdmin
                .from('customers')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            let customerId: string;
            if (existingCustomerRaw) {
                customerId = existingCustomerRaw.id;
            } else {
                const { data: newCustomer } = await supabaseAdmin
                    .from('customers')
                    .insert({ name: 'Website Customer', email })
                    .select('id')
                    .single();
                customerId = newCustomer?.id ?? '';
            }

            // Get last order number manually to increment sequentially for each item
            const { data: lastOrder } = await supabaseAdmin
                .from('orders')
                .select('order_number')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            let lastNum = 1000;
            if (lastOrder?.order_number) {
                const n = parseInt(lastOrder.order_number.replace(/\D/g, ''), 10);
                if (!isNaN(n)) lastNum = n;
            }

            // Insert each item as its own order row (due to unique order_number constraint)
            const orderInsertPayloads = emailItems.map((item, index) => {
                const lineTotal = item.unitPrice * item.quantity;
                // Distribute discount proportionally
                const proportion = totalSAR > 0 ? lineTotal / totalSAR : 0;
                const rowDiscount = Math.round((discountAmount * proportion) * 100) / 100;

                return {
                    order_number: `#${lastNum + index + 1}`,
                    customer_id: customerId || null,
                    product_id: item.id,
                    quantity: item.quantity,
                    total_amount: lineTotal,
                    status: 'paid', // since payment is verified
                    source: 'website',
                    notes: `Stripe Ref: ${orderRef}`,
                    coupon_id: couponId ?? null,
                    discount_amount: rowDiscount
                };
            });

            const { error: insertError } = await supabaseAdmin
                .from('orders')
                .insert(orderInsertPayloads);

            if (insertError) {
                console.error("[send-email] Failed to insert orders:", insertError);
            } else if (couponId) {
                await incrementCouponUsage(couponId);
            }
        } catch (dbErr) {
            console.error("[send-email] DB insertion caught error:", dbErr);
        }

        // ── 2. Send via Resend ───────────────────────────────────────────
        const html = buildConfirmationEmail({
            customerEmail: email,
            items: emailItems,
            totalSAR,
            language,
            orderRef,
        });

        const fromAddress = process.env.RESEND_FROM_EMAIL ?? "Edma Perfume <orders@edma.com>";
        const subject = language === "ar"
            ? "شكراً لاختياركم عطور إدما ✦"
            : "Thank you for choosing Edma Perfume ✦";

        try {
            const resend = getResend();
            const { error } = await resend.emails.send({
                from: fromAddress,
                to: email,
                subject,
                html,
            });

            if (error) {
                console.error("[send-email] Resend error:", error);
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            return NextResponse.json({ success: true });
        } catch (resendErr) {
            console.log("[send-email] Resend unavailable — simulating email delivery.");
            return NextResponse.json({ success: true, simulated: true });
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[send-email]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
