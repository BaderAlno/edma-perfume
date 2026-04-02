import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { order_id, total_amount, customer_name, customer_email, customer_phone, payment_type } = body;

        if (!order_id || !total_amount) {
            return NextResponse.json({ error: 'Missing order details for payment' }, { status: 400 });
        }

        const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;

        // Host from request for exact callback formatting
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Tap Charge Payload
        const tapPayload = {
            amount: total_amount,
            currency: 'SAR',
            customer_initiated: true,
            threeDSecure: true,
            save_card: false,
            description: `Payment for Order #${order_id}`,
            receipt: { email: true, sms: true },
            customer: {
                first_name: customer_name.split(' ')[0] || 'Customer',
                last_name: customer_name.split(' ').slice(1).join(' ') || 'EDMA',
                email: customer_email || 'test@example.com',
                phone: { country_code: '966', number: customer_phone.replace(/\D/g, '') || '500000000' }
            },
            source: { id: payment_type === 'apple_pay' ? 'src_apple_pay' : 'src_all' },
            post: { url: `${origin}/api/payment/tap/callback` },
            redirect: { url: `${origin}/api/payment/tap/callback` }
        };

        const response = await fetch('https://api.tap.company/v2/charges', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TAP_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(tapPayload)
        });

        const data = await response.json();

        if (!response.ok || data.errors) {
            console.error('[TAP] Charge Request Error:', data);
            return NextResponse.json({ error: 'Payment gateway error', details: data }, { status: 502 });
        }

        // Save Tap charge ID to the order
        const { error: dbErr } = await (supabaseAdmin as any)
            .from('orders')
            .update({ payment_id: data.id })
            .eq('id', order_id);

        if (dbErr) {
            console.error('[TAP] Failed to save payment_id to order', dbErr);
        }

        // Return the Tap transaction URL for client redirect
        if (data.transaction && data.transaction.url) {
            return NextResponse.json({ url: data.transaction.url });
        } else {
            return NextResponse.json({ error: 'Missing transaction URL from Tap' }, { status: 500 });
        }

    } catch (err) {
        console.error('[TAP] API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
