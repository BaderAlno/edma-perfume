import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { code, cartItems } = body;

        if (!code) return NextResponse.json({ error: 'الرجاء إدخال رمز الكوبون' }, { status: 400 });
        if (!cartItems || cartItems.length === 0) return NextResponse.json({ error: 'السلة فارغة' }, { status: 400 });

        const orderTotal = cartItems.reduce((sum: number, item: any) => sum + item.price_sar * item.quantity, 0);

        const { data: coupon, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase().trim())
            .single();

        if (error || !coupon) {
            return NextResponse.json({ error: 'الكوبون غير صحيح' }, { status: 404 });
        }

        if (!coupon.is_active) {
            return NextResponse.json({ error: 'عذراً، هذا الكوبون غير مفعل' }, { status: 400 });
        }

        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return NextResponse.json({ error: 'عذراً، انتهت صلاحية هذا الكوبون' }, { status: 400 });
        }

        if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
            return NextResponse.json({ error: 'عذراً، تم تجاوز الحد الأقصى لاستخدام الكوبون' }, { status: 400 });
        }

        if (coupon.min_order && orderTotal < Number(coupon.min_order)) {
            return NextResponse.json({ error: `يجب أن يكون الحد الأدنى للطلب ${coupon.min_order} ر.س لاستخدام الكوبون` }, { status: 400 });
        }

        // Calculate discount
        let discountableAmount = orderTotal;

        // If coupon is restricted to specific products, sum only those products
        if (coupon.applicable_product_ids && coupon.applicable_product_ids.length > 0) {
            const allowedIds = coupon.applicable_product_ids;
            discountableAmount = cartItems
                .filter((item: any) => allowedIds.includes(item.id))
                .reduce((sum: number, item: any) => sum + item.price_sar * item.quantity, 0);

            if (discountableAmount === 0) {
                return NextResponse.json({ error: 'هذا الكوبون لا يشمل المنتجات الموجودة في سلتك' }, { status: 400 });
            }
        }

        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = discountableAmount * (Number(coupon.value) / 100);
        } else {
            discount = Math.min(Number(coupon.value), discountableAmount);
        }

        return NextResponse.json({
            valid: true,
            couponId: coupon.id,
            discountAmount: discount,
            newTotal: orderTotal - discount,
            couponCode: coupon.code,
            message: 'تم تطبيق الكوبون بنجاح!'
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
