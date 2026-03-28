import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { buildConfirmationEmail } from "@/lib/emailTemplate";
import { lookupPrice, SERVER_PRODUCTS } from "@/lib/products";

function getResend() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        throw new Error("RESEND_API_KEY is not set in environment variables.");
    }
    return new Resend(key);
}

interface IncomingItem {
    id:       string;
    quantity: number;
}

interface SendEmailBody {
    email:     string;
    items:     IncomingItem[];
    language:  "en" | "ar";
    orderRef:  string; // Stripe PaymentIntent ID
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SendEmailBody;
        const { email, items, language = "en", orderRef } = body;

        if (!email || !items?.length || !orderRef) {
            return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
        }

        // Build order lines with server-side prices
        const emailItems = items.map((item) => {
            const product   = SERVER_PRODUCTS[item.id];
            const unitPrice = lookupPrice(item.id);
            const qty       = Math.max(1, Math.round(item.quantity));
            return {
                name:      product ? product.name[language] : item.id,
                quantity:  qty,
                unitPrice,
            };
        });

        const totalSAR = emailItems.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity, 0
        );

        const html = buildConfirmationEmail({
            customerEmail: email,
            items:         emailItems,
            totalSAR,
            language,
            orderRef,
        });

        const fromAddress =
            process.env.RESEND_FROM_EMAIL ?? "Edma Perfume <orders@edma.com>";

        const subject =
            language === "ar"
                ? "شكراً لاختياركم عطور إدما ✦"
                : "Thank you for choosing Edma Perfume ✦";

        // ── Send via Resend (simulates locally if key is invalid) ─────────
        try {
            const resend = getResend();
            const { error } = await resend.emails.send({
                from:    fromAddress,
                to:      email,
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
            console.log(`[send-email] To:      ${email}`);
            console.log(`[send-email] Subject: ${subject}`);
            console.log(`[send-email] Order:   ${orderRef}`);
            console.log("[send-email] Items:", JSON.stringify(emailItems, null, 2));
            console.log("[send-email] Total:", totalSAR, "SAR");
            console.log("[send-email] (Resend error:", resendErr instanceof Error ? resendErr.message : resendErr, ")");
            return NextResponse.json({ success: true, simulated: true });
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        console.error("[send-email]", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
