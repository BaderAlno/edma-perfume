'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import type { Database } from '@/lib/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];

// ── Public storefront types (existing — used by shop pages) ──────────────────

export interface ProductForShop {
    id: string;
    name: string;
    name_ar: string;
    price_sar: number;
    description_en: string | null;
    description_ar: string | null;
    quote_en?: string | null;
    quote_ar?: string | null;
    top_notes?: string[] | null;
    heart_notes?: string[] | null;
    base_notes?: string[] | null;
    image_url: string | null;
    stock_quantity: number;
    is_active: boolean;
    out_of_stock: boolean;
    low_stock: boolean;
}

// ── Admin-extended type ───────────────────────────────────────────────────────

export interface ProductAdmin extends ProductForShop {
    low_stock_threshold: number;
    created_at: string;
    total_sold: number;   // sum of delivered order quantities
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface CreateProductInput {
    name: string;
    name_ar: string;
    price_sar: number;
    stock_quantity: number;
    low_stock_threshold: number;
    description_en?: string | null;
    description_ar?: string | null;
    quote_en?: string | null;
    quote_ar?: string | null;
    top_notes?: string[] | null;
    heart_notes?: string[] | null;
    base_notes?: string[] | null;
    image_url?: string | null;
    is_active?: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

// ── Public storefront queries (unchanged — used by shop/checkout) ─────────────

export async function getProducts(): Promise<ProductForShop[]> {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at');

    if (error) throw error;

    return (data ?? []).map(p => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        price_sar: Number(p.price_sar || p.price),
        description_en: p.description_en,
        description_ar: p.description_ar,
        quote_en: p.quote_en,
        quote_ar: p.quote_ar,
        top_notes: p.top_notes,
        heart_notes: p.heart_notes,
        base_notes: p.base_notes,
        image_url: p.image_url,
        stock_quantity: p.stock_quantity,
        is_active: p.is_active,
        out_of_stock: p.stock_quantity === 0,
        low_stock: p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold,
    }));
}

export async function getProductById(id: string): Promise<ProductForShop | null> {
    const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        name: data.name,
        name_ar: data.name_ar,
        price_sar: Number(data.price_sar || data.price),
        description_en: data.description_en,
        description_ar: data.description_ar,
        quote_en: data.quote_en,
        quote_ar: data.quote_ar,
        top_notes: data.top_notes,
        heart_notes: data.heart_notes,
        base_notes: data.base_notes,
        image_url: data.image_url,
        stock_quantity: data.stock_quantity,
        is_active: data.is_active,
        out_of_stock: data.stock_quantity === 0,
        low_stock: data.stock_quantity > 0 && data.stock_quantity <= data.low_stock_threshold,
    };
}

export async function updateStock(productId: string, quantity: number): Promise<void> {
    const { error } = await supabaseAdmin
        .from('products')
        .update({ stock_quantity: quantity })
        .eq('id', productId);

    if (error) throw error;
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export async function bulkInsertProducts(products: CreateProductInput[]): Promise<void> {
    // Map input 'price_sar' to DB column 'price'
    const dbProducts = products.map(p => {
        const { price_sar, ...rest } = p;
        return { ...rest, price: price_sar };
    });

    const { error } = await supabaseAdmin
        .from('products')
        .insert(dbProducts as any); // Type cast due to added quote fields not in strictly generated DB types yet

    if (error) throw new Error(error.message);
}

/** Fetch ALL products (active + inactive) with total units sold. */
export async function getAllProductsAdmin(): Promise<ProductAdmin[]> {
    const [productsRes, ordersRes] = await Promise.all([
        supabaseAdmin
            .from('products')
            .select('*')
            .order('created_at', { ascending: false }),
        supabaseAdmin
            .from('orders')
            .select('product_id, quantity')
            .eq('status', 'delivered'),
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);

    // Aggregate delivered quantities per product
    const soldMap = new Map<string, number>();
    for (const o of ordersRes.data ?? []) {
        if (o.product_id) {
            soldMap.set(o.product_id, (soldMap.get(o.product_id) ?? 0) + (o.quantity ?? 0));
        }
    }

    return (productsRes.data ?? []).map(p => ({
        id: p.id,
        name: p.name,
        name_ar: p.name_ar,
        price_sar: Number(p.price_sar),
        description_en: p.description_en ?? null,
        description_ar: p.description_ar ?? null,
        quote_en: p.quote_en ?? null,
        quote_ar: p.quote_ar ?? null,
        top_notes: p.top_notes ?? [],
        heart_notes: p.heart_notes ?? [],
        base_notes: p.base_notes ?? [],
        image_url: p.image_url ?? null,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        is_active: p.is_active,
        created_at: p.created_at,
        out_of_stock: p.stock_quantity === 0,
        low_stock: p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold,
        total_sold: soldMap.get(p.id) ?? 0,
    }));
}

/** Create a new product. */
export async function createProduct(input: CreateProductInput): Promise<ProductAdmin> {
    const { data, error } = await supabaseAdmin
        .from('products')
        .insert({
            name: input.name,
            name_ar: input.name_ar,
            price: input.price_sar,
            stock_quantity: input.stock_quantity,
            low_stock_threshold: input.low_stock_threshold,
            description_en: input.description_en ?? null,
            description_ar: input.description_ar ?? null,
            quote_en: input.quote_en ?? null,
            quote_ar: input.quote_ar ?? null,
            top_notes: input.top_notes ?? [],
            heart_notes: input.heart_notes ?? [],
            base_notes: input.base_notes ?? [],
            image_url: input.image_url ?? null,
            is_active: input.is_active ?? true,
        } as any)
        .select('*')
        .single();

    if (error) throw new Error(error.message);

    return {
        id: data.id,
        name: data.name,
        name_ar: data.name_ar,
        price_sar: Number(data.price_sar),
        description_en: data.description_en ?? null,
        description_ar: data.description_ar ?? null,
        quote_en: data.quote_en ?? null,
        quote_ar: data.quote_ar ?? null,
        top_notes: data.top_notes ?? [],
        heart_notes: data.heart_notes ?? [],
        base_notes: data.base_notes ?? [],
        image_url: data.image_url ?? null,
        stock_quantity: data.stock_quantity,
        low_stock_threshold: data.low_stock_threshold,
        is_active: data.is_active,
        created_at: data.created_at,
        out_of_stock: data.stock_quantity === 0,
        low_stock: data.stock_quantity > 0 && data.stock_quantity <= data.low_stock_threshold,
        total_sold: 0,
    };
}

/** Update product fields. Partial — only provided fields are updated. */
export async function updateProduct(
    id: string,
    input: UpdateProductInput,
): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.name_ar !== undefined) patch.name_ar = input.name_ar;
    if (input.price_sar !== undefined) patch.price = input.price_sar;
    if (input.stock_quantity !== undefined) patch.stock_quantity = input.stock_quantity;
    if (input.low_stock_threshold !== undefined) patch.low_stock_threshold = input.low_stock_threshold;
    if (input.description_en !== undefined) patch.description_en = input.description_en;
    if (input.description_ar !== undefined) patch.description_ar = input.description_ar;
    if (input.quote_en !== undefined) patch.quote_en = input.quote_en;
    if (input.quote_ar !== undefined) patch.quote_ar = input.quote_ar;
    if (input.top_notes !== undefined) patch.top_notes = input.top_notes;
    if (input.heart_notes !== undefined) patch.heart_notes = input.heart_notes;
    if (input.base_notes !== undefined) patch.base_notes = input.base_notes;
    if (input.image_url !== undefined) patch.image_url = input.image_url;
    if (input.is_active !== undefined) patch.is_active = input.is_active;

    if (Object.keys(patch).length === 0) return;

    const { error } = await supabaseAdmin
        .from('products')
        .update(patch as any)
        .eq('id', id);

    if (error) throw new Error(error.message);
}

/**
 * Soft-delete a product by setting is_active = false.
 * The product stays in the DB and its order history is preserved.
 */
export async function deleteProduct(id: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('products')
        .update({ is_active: false } as any)
        .eq('id', id);

    if (error) throw new Error(error.message);
}

/**
 * Upload a product image to Supabase 'product-images' storage bucket.
 * Accepts FormData with a 'file' entry.
 * Returns the public URL of the uploaded image.
 */
export async function uploadProductImage(formData: FormData): Promise<string> {
    const file = formData.get('file') as File | null;
    if (!file) throw new Error('لم يتم اختيار صورة');

    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Convert File → Buffer for Node.js runtime compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, buffer, {
            contentType: file.type || 'image/jpeg',
            upsert: false,
        });

    if (error) throw new Error(`فشل رفع الصورة: ${error.message}`);

    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('product-images')
        .getPublicUrl(data.path);

    return publicUrl;
}
