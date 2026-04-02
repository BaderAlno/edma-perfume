import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: products, error } = await supabaseAdmin.from('products').select('*');
    if (error) console.error(error);
    else console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error);
