import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateOrderNumber, pushNotification, deductStock } from '@/lib/supabase-admin';

export interface CheckoutBody {
    items: {
        id: string;
        quantity: number;
        price_sar?: number;
    }[];
    payment_method: string;
    customer: {
        name: string;
        phone: string;
        email?: string;
    };
    source: 'website' | 'whatsapp' | 'instagram';
    notes?: string;
}

export async function POST(req: NextRequest) {
    let body: CheckoutBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { items, payment_method, customer, source, notes } = body;

    // Validate required fields
    if (!items || !items.length || !customer?.name || !customer?.phone || !payment_method) {
        return NextResponse.json({ error: 'بيانات مطلوبة مفقودة' }, { status: 400 });
    }

    console.log("[CHECKOUT] Received checkout payload:", JSON.stringify(body, null, 2));

    try {
        // 1. Calculate pricing and validate stock
        let total_amount = 0;
        const verifiedItems = [];

        console.log(`[CHECKOUT] Validating ${items.length} items against the 'products' table...`);

        for (const item of items) {
            // First check if it's a valid UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
            if (!isUUID) {
                console.warn(`[CHECKOUT] Invalid UUID format detected for item: ${item.id}. Rejecting checkout.`);
                return NextResponse.json({ error: `يوجد منتج غير صالح في السلة (${item.id}).`, errorCode: 'INVALID_CART' }, { status: 400 });
            }

            console.log(`[CHECKOUT] Searching 'products' table for ID: ${item.id}`);
            const { data: productRaw, error: productErr } = await supabaseAdmin
                .from('products')
                .select('id, name, price_sar, stock_quantity, is_active')
                .eq('id', item.id)
                .maybeSingle();

            const product = productRaw as any;

            if (productErr || !product) {
                // Product not in DB — fall back to the price provided by the cart (local/mock products)
                if (!item.price_sar || item.price_sar <= 0) {
                    console.error(`[CHECKOUT] Product not found and no fallback price for: ${item.id}`);
                    return NextResponse.json({ error: `المنتج غير موجود في قاعدة البيانات: ${item.id}`, errorCode: 'INVALID_CART' }, { status: 404 });
                }
                console.warn(`[CHECKOUT] Product ${item.id} not in DB — using cart price ${item.price_sar} SAR as fallback`);
                const fallbackPrice = Number(item.price_sar);
                total_amount += fallbackPrice * Number(item.quantity);
                verifiedItems.push({
                    product_id: item.id,
                    quantity: Number(item.quantity),
                    unit_price: fallbackPrice,
                    total_price: fallbackPrice * Number(item.quantity),
                    is_db_product: false
                });
                continue;
            }

            if (!product.is_active) {
                return NextResponse.json({ error: `المنتج غير متاح حالياً: ${product.name}` }, { status: 409 });
            }

            if (product.stock_quantity < item.quantity) {
                return NextResponse.json({
                    error: `الكمية المطلوبة غير متوفرة لمنتج ${product.name}. المتاح: ${product.stock_quantity}`,
                }, { status: 409 });
            }

            total_amount += Number(product.price_sar) * Number(item.quantity);
            verifiedItems.push({
                product_id: product.id,
                quantity: Number(item.quantity),
                unit_price: Number(product.price_sar),
                total_price: Number(product.price_sar) * Number(item.quantity),
                is_db_product: true
            });
        }

        // 2. Upsert customer (find by phone or create new)
        console.log(`[CHECKOUT] Processing customer: ${customer.phone}`);
        const { data: existingCustomerRaw } = await supabaseAdmin
            .from('customers')
            .select('id')
            .eq('phone', customer.phone)
            .maybeSingle();

        let customer_id: string;

        if (existingCustomerRaw) {
            customer_id = (existingCustomerRaw as any).id;
            console.log(`[CHECKOUT] Updating existing customer: ${customer_id}`);
            await (supabaseAdmin as any)
                .from('customers')
                .update({ name: customer.name, ...(customer.email ? { email: customer.email } : {}) })
                .eq('id', customer_id);
        } else {
            console.log("[CHECKOUT] Creating new customer");
            const { data: newCustomer, error: custErr } = await supabaseAdmin
                .from('customers')
                .insert({ name: customer.name, phone: customer.phone, email: customer.email ?? null })
                .select('id')
                .single();

            if (custErr || !newCustomer) {
                console.error("[CHECKOUT] Customer creation failed", custErr);
                return NextResponse.json({ error: 'فشل إنشاء بيانات العميل' }, { status: 500 });
            }
            customer_id = (newCustomer as any).id;
        }

        // 3. Deduct stock for all items (skip items that are not in the DB)
        console.log("[CHECKOUT] Deducting stock...");
        for (const vItem of verifiedItems) {
            const { data: exists } = await supabaseAdmin
                .from('products')
                .select('id')
                .eq('id', vItem.product_id)
                .maybeSingle();
            if (!exists) {
                console.warn(`[CHECKOUT] Skipping stock deduction for non-DB product: ${vItem.product_id}`);
                continue;
            }
            const stockResult = await deductStock(vItem.product_id, vItem.quantity, 'sale');
            if (!stockResult.ok) {
                console.error(`[CHECKOUT] Stock deduction failed for ${vItem.product_id}:`, stockResult.error);
                return NextResponse.json({ error: stockResult.error ?? 'فشل خصم المخزون' }, { status: 500 });
            }
        }

        // 4. Create main order
        let order_number = await generateOrderNumber();
        const initial_status = 'pending';

        // Resolve a valid DB product_id for the FK column — null if none exist
        const dbProductId = verifiedItems.find(i => (i as any).is_db_product)?.product_id ?? null;
        // If no DB product in cart, try to find any active product to satisfy FK (TEST MODE only)
        let fallbackProductId: string | null = dbProductId;
        if (!fallbackProductId) {
            const { data: anyProduct } = await supabaseAdmin
                .from('products')
                .select('id')
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();
            fallbackProductId = (anyProduct as any)?.id ?? null;
        }

        console.log(`[CHECKOUT] Attempting to create order ${order_number} for customer ${customer_id} with total ${total_amount}`);

        let orderData = null;
        let orderErr = null;
        let attempt = 0;
        const maxAttempts = 5;

        while (attempt < maxAttempts) {
            const orderPayload: Record<string, any> = {
                order_number,
                customer_id,
                total_amount,
                status: initial_status,
                source: source,
                notes: notes || null,
                payment_method: payment_method,
                payment_status: 'pending',
                quantity: verifiedItems.reduce((acc, it) => acc + Number(it.quantity), 0)
            };
            // Only include product_id if we have a valid FK reference
            if (fallbackProductId) {
                orderPayload.product_id = fallbackProductId;
            }

            const result = await (supabaseAdmin as any)
                .from('orders')
                .insert(orderPayload)
                .select('id, order_number')
                .single();

            orderData = result.data;
            orderErr = result.error;

            if (orderErr) {
                // Check if the error is a duplicate key constraint error (code 23505)
                if (orderErr.code === '23505' || (orderErr.message && orderErr.message.toLowerCase().includes('unique'))) {
                    console.warn(`[CHECKOUT] Duplicate order number ${order_number} detected. Retrying... (Attempt ${attempt + 1} of ${maxAttempts})`);
                    // Generate a truly unique/random order number for the retry
                    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
                    order_number = `#EDMA-${Date.now().toString().slice(-4)}${randomStr}`;
                    attempt++;
                } else {
                    console.error("[CHECKOUT] Order creation failed with non-duplicate error:", orderErr);
                    break;
                }
            } else {
                // Success
                break;
            }
        }

        if (orderErr || !orderData) {
            console.error("[CHECKOUT] Order creation failed completely after retries", orderErr);
            // Revert stock? Ideally yes, but skipping complex rollbacks for MVP
            return NextResponse.json({ error: 'فشل إنشاء الطلب الأساسي' }, { status: 500 });
        }

        // Use the final assigned order_number which could have changed during retries
        order_number = orderData.order_number || order_number;
        const order_id = orderData.id;

        // 5. Create Order Items
        const validDbItems = verifiedItems.filter(item => item.is_db_product);
        console.log(`[CHECKOUT] Found ${validDbItems.length} valid DB items to insert for order_id: ${order_id}`);
        
        if (validDbItems.length > 0) {
            const orderItemsPayload = validDbItems.map(item => ({
                order_id: order_id,
                product_id: item.product_id,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price)
                // Note: Omitted total_price from payload mapping to ensure alignment with requested columns
            }));

            const { error: itemsErr } = await (supabaseAdmin as any)
                .from('order_items')
                .insert(orderItemsPayload);

            if (itemsErr) {
                console.error("[CHECKOUT] Order Items creation failed! Supabase Error:", JSON.stringify(itemsErr, null, 2));
                return NextResponse.json({ error: 'فشل إنشاء تفاصيل الطلب', details: itemsErr }, { status: 500 });
            }
        } else {
            console.warn("[CHECKOUT] Cart contained only mock products; skipping order_items insert to preserve Foreign Key integrity.");
        }

        // 6. Push Admin Notification
        await pushNotification(
            `طلب جديد #${order_number}`,
            `تم استلام طلب جديد بقيمة ${total_amount} ريال عبر ${payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : payment_method}`,
            'order'
        );

        console.log(`[CHECKOUT] Checkout completed successfully! Order ID: ${order_id}`);

        // TEST MODE: redirect all online payment methods to mock gateway
        const isOnlinePayment = !['cash_on_delivery', 'bank_transfer'].includes(payment_method);
        return NextResponse.json({
            success: true,
            order_id,
            order_number,
            payment_method,
            ...(isOnlinePayment && {
                redirect_url: `/payment/mock?order_id=${order_id}&order_number=${encodeURIComponent(order_number)}`
            })
        });

    } catch (err) {
        console.error("[CHECKOUT] Unexpected checkout error:", err);
        return NextResponse.json({ error: 'حدث خطأ غير متوقع' }, { status: 500 });
    }
}
