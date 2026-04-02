'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';

export interface CouponRow {
    id: string;
    code: string;
    type: 'fixed' | 'percentage';
    value: number;
    min_order: number | null;
    max_uses: number | null;
    uses_count: number;
    expires_at: string | null;
    applicable_product_ids: string[] | null;
    is_active: boolean;
    created_at?: string;
}

export type CreateCouponInput = Omit<CouponRow, 'id' | 'uses_count' | 'created_at'>;

export async function getCouponsAdmin(): Promise<CouponRow[]> {
    const { data, error } = await supabaseAdmin
        .from('coupons')
        .select('*');

    if (error) throw new Error(error.message);

    return data as CouponRow[];
}

export async function createCoupon(input: CreateCouponInput): Promise<void> {
    const { error } = await supabaseAdmin
        .from('coupons')
        .insert({
            code: input.code.toUpperCase().trim(),
            type: input.type,
            value: input.value,
            min_order: input.min_order,
            max_uses: input.max_uses,
            expires_at: input.expires_at,
            is_active: input.is_active ?? true
        } as any);

    if (error) {
        if (error.code === '23505') throw new Error('رقم الكوبون موجود مسبقاً (Coupon already exists)');
        throw new Error(error.message);
    }
}

export async function toggleCouponStatus(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabaseAdmin
        .from('coupons')
        .update({ is_active } as any)
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function deleteCoupon(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('coupons')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

export async function getCouponAnalytics() {
    const { data: coupons, error } = await supabaseAdmin
        .from('coupons')
        .select('id, code, uses_count');

    if (error) throw new Error(error.message);

    const couponsWithStats = (coupons || []).map(c => ({
        id: c.id,
        code: c.code,
        uses_count: c.uses_count,
        revenue_generated: 0 // Mocked to 0 because orders table is missing coupon_id
    }));

    const topByUsage = [...couponsWithStats].sort((a, b) => b.uses_count - a.uses_count).slice(0, 5);
    const topByRevenue = [...couponsWithStats].sort((a, b) => b.revenue_generated - a.revenue_generated).slice(0, 5);

    const totalUsage = couponsWithStats.reduce((sum, c) => sum + c.uses_count, 0);

    return {
        topByUsage,
        topByRevenue,
        totalUsage
    };
}

export async function incrementCouponUsage(couponId: string): Promise<void> {
    // Note: To prevent race conditions we'd normally use an RPC (function) to atomically increment. 
    // Since we're using Supabase JS which doesn't expose arithmetic operations easily on update without RPC,
    // we fetch and update. In a high-traffic production, replace with an RPC like increment_coupon_uses()
    const { data: coupon, error: fetchErr } = await supabaseAdmin
        .from('coupons')
        .select('uses_count')
        .eq('id', couponId)
        .single();

    if (fetchErr) return;

    await supabaseAdmin
        .from('coupons')
        .update({ uses_count: coupon.uses_count + 1 } as any)
        .eq('id', couponId);
}

