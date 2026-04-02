import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, pushNotification } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const tap_id = url.searchParams.get('tap_id');

    // Handle missing callback parameter
    if (!tap_id) {
        return NextResponse.redirect(new URL('/thank-you?error=missing_tap_id', req.url));
    }

    try {
        const TAP_SECRET_KEY = process.env.TAP_SECRET_KEY;

        // 1. Verify Charge Status via Tap API
        const response = await fetch(`https://api.tap.company/v2/charges/${tap_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TAP_SECRET_KEY}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[TAP VERIFY] Error fetching charge:', data);
            return NextResponse.redirect(new URL('/thank-you?error=gateway_error', req.url));
        }

        const status = data.status; // 'CAPTURED', 'DECLINED', 'FAILED' etc.
        const order_id = data.description.replace('Payment for Order #', '');

        // 2. Fetch the actual order from db using the tap charge ID to make sure it matches
        const { data: orderData, error: dbFetchErr } = await (supabaseAdmin as any)
            .from('orders')
            .select('id, order_number')
            .eq('payment_id', tap_id)
            .single();

        if (dbFetchErr || !orderData) {
            console.error('[TAP VERIFY] Order not found for tap_id:', tap_id);
            return NextResponse.redirect(new URL('/thank-you?error=order_not_found', req.url));
        }

        if (status === 'CAPTURED') {
            // Success! Update order
            await (supabaseAdmin as any)
                .from('orders')
                .update({ payment_status: 'paid' })
                .eq('payment_id', tap_id);

            // Push success notification
            await pushNotification(`مدفوع: طلب #${orderData.order_number}`, 'تم تأكيد الدفع عبر بوابة Tap بنجاح.', 'order');

            return NextResponse.redirect(new URL(`/thank-you?order=${orderData.order_number}&method=${data.source?.payment_type || 'card'}`, req.url));
        } else {
            // Failed or declined
            await (supabaseAdmin as any)
                .from('orders')
                .update({ payment_status: 'failed' })
                .eq('payment_id', tap_id);

            return NextResponse.redirect(new URL(`/thank-you?error=payment_failed&status=${status}`, req.url));
        }

    } catch (err) {
        console.error('[TAP VERIFY] Unexpected error:', err);
        return NextResponse.redirect(new URL('/thank-you?error=internal_error', req.url));
    }
}
