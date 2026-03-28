import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = Boolean(url && key);

// ─── Perfume record shape (matches the Supabase table) ──────────────────────
export interface PerfumeRecord {
    id:              string;
    name_en:         string;
    name_ar:         string;
    price_sar:       number;
    description_en:  string;
    description_ar:  string;
    notes_en:        string[];
    notes_ar:        string[];
    image_url:       string | null;
    created_at:      string;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────
const BUCKET = "perfume-images";

export async function uploadPerfumeImage(file: File): Promise<string | null> {
    if (!supabase) return null;
    const path = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
    });
    if (error || !data) return null;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return publicUrl;
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────
export async function fetchPerfumes(): Promise<PerfumeRecord[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from("perfumes")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
}

export async function createPerfume(
    record: Omit<PerfumeRecord, "id" | "created_at">
): Promise<PerfumeRecord> {
    if (!supabase) throw new Error("Supabase not configured.");
    const { data, error } = await supabase.from("perfumes").insert(record).select().single();
    if (error) throw error;
    return data;
}

export async function updatePerfume(
    id: string,
    record: Partial<Omit<PerfumeRecord, "id" | "created_at">>
): Promise<PerfumeRecord> {
    if (!supabase) throw new Error("Supabase not configured.");
    const { data, error } = await supabase.from("perfumes").update(record).eq("id", id).select().single();
    if (error) throw error;
    return data;
}

export async function deletePerfume(id: string): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured.");
    const { error } = await supabase.from("perfumes").delete().eq("id", id);
    if (error) throw error;
}

/*
 * ─── Required Supabase setup ──────────────────────────────────────────────────
 *
 * 1. Create a project at https://supabase.com
 * 2. Add to .env.local:
 *      NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * 3. Run this SQL in the Supabase SQL editor:
 *
 *    create table perfumes (
 *      id              uuid primary key default gen_random_uuid(),
 *      name_en         text not null,
 *      name_ar         text not null,
 *      price_sar       integer not null,
 *      description_en  text default '',
 *      description_ar  text default '',
 *      notes_en        text[] default '{}',
 *      notes_ar        text[] default '{}',
 *      image_url       text,
 *      created_at      timestamptz default now()
 *    );
 *
 *    alter table perfumes enable row level security;
 *    create policy "Public read" on perfumes for select using (true);
 *    create policy "Authenticated write" on perfumes for all using (auth.role() = 'authenticated');
 *
 * 4. Create a storage bucket named "perfume-images" (public).
 */
