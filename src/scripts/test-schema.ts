import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: ordersData, error: ordersErr } = await supabaseAdmin.from('orders').select('*').limit(1);
    console.log("Orders columns:", ordersData ? Object.keys(ordersData[0] || {}) : ordersErr);

    const { data: itemsData, error: itemsErr } = await supabaseAdmin.from('order_items').select('*').limit(1);
    console.log("Order_items columns:", itemsData ? Object.keys(itemsData[0] || {}) : itemsErr);
}

main().catch(console.error);
