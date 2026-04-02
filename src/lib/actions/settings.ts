'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateTag, unstable_cache } from 'next/cache';

/**
 * Fetch a single setting by key.
 */
export async function getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error || !data) return null;
    return data.value;
}

/**
 * Fetch multiple settings by their keys.
 * Returns a record of key-value pairs.
 */
export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
    let query = supabaseAdmin.from('settings').select('key, value');

    if (keys && keys.length > 0) {
        query = query.in('key', keys);
    }

    const { data, error } = await query;
    if (error || !data) return {};

    const record: Record<string, string> = {};
    for (const row of data) {
        record[row.key] = row.value;
    }

    return record;
}

/**
 * Update a single setting.
 */
export async function updateSetting(key: string, value: string): Promise<boolean> {
    const { error } = await supabaseAdmin
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
        console.error(`Error updating setting ${key}:`, error);
        return false;
    }

    // Specifically revalidate the announcement tag if it's the announcement text
    if (key === 'announcement_text') {
        revalidateTag('settings', 'default');
    }

    return true;
}

/**
 * Batch update multiple settings.
 */
export async function updateSettings(settings: Record<string, string>): Promise<boolean> {
    const upsertData = Object.entries(settings).map(([key, value]) => ({
        key,
        value
    }));

    if (upsertData.length === 0) return true;

    const { error } = await supabaseAdmin
        .from('settings')
        .upsert(upsertData, { onConflict: 'key' });

    if (error) {
        console.error('Error updating multi settings:', error);
        return false;
    }

    if ('announcement_text' in settings || 'is_maintenance_mode' in settings) {
        revalidateTag('settings', 'default');
    }

    return true;
}

/**
 * Cached fetch for global announcement to avoid DB hits.
 */
export const getCachedAnnouncement = unstable_cache(
    async () => {
        return await getSetting('announcement_text');
    },
    ['announcement_text_cache'],
    { tags: ['settings'], revalidate: 60 }
);
