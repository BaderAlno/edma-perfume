import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { order_id } = body;

        if (!order_id) {
            return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('orders')
            .update({ payment_status: 'paid', status: 'processing' })
            .eq('id', order_id);

        if (error) {
            console.error("[MOCK PAYMENT] Update failed", error);
            return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[MOCK PAYMENT] Unexpected Error", err);
        return NextResponse.json({ error: 'Unexpected Error' }, { status: 500 });
    }
}
