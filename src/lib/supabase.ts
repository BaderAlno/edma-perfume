import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!url || !key) {
    console.warn(
        '[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
        'Add them to .env.local — see .env.local.example for reference.'
    );
}

/**
 * Browser / server-component client.
 * Subject to Row Level Security — the signed-in user's JWT is sent with every request.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = createClient<any>(url, key);

export const isSupabaseConfigured = Boolean(url && key);

// ── Legacy perfumes helpers (keep for backward compatibility) ─────────────────

export interface PerfumeRecord {
    id:             string;
    name_en:        string;
    name_ar:        string;
    price_sar:      number;
    description_en: string;
    description_ar: string;
    notes_en:       string[];
    notes_ar:       string[];
    image_url:      string | null;
    created_at:     string;
}

const BUCKET = 'perfume-images';

export async function uploadPerfumeImage(file: File): Promise<string | null> {
    const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error || !data) return null;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return publicUrl;
}

export async function fetchPerfumes(): Promise<PerfumeRecord[]> {
    const { data, error } = await supabase
        .from('perfumes')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function createPerfume(
    record: Omit<PerfumeRecord, 'id' | 'created_at'>
): Promise<PerfumeRecord> {
    const { data, error } = await supabase.from('perfumes').insert(record).select().single();
    if (error) throw error;
    return data;
}

export async function updatePerfume(
    id: string,
    record: Partial<Omit<PerfumeRecord, 'id' | 'created_at'>>
): Promise<PerfumeRecord> {
    const { data, error } = await supabase.from('perfumes').update(record).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deletePerfume(id: string): Promise<void> {
    const { error } = await supabase.from('perfumes').delete().eq('id', id);
    if (error) throw error;
}
