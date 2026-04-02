"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/lib/database.types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

/**
 * Highly cached internal server fetcher for products by note tags.
 * Revalidates every hour (3600 seconds) for edge/CDN performance.
 */
export async function getProductsByNote(
    noteType: "top_notes" | "heart_notes" | "base_notes",
    tags: string[]
): Promise<Product[]> {
    // If no tags provided, return empty
    if (!tags || tags.length === 0) return [];

    const { data, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("is_active", true)
        // using overlaps operator '&&' which checks if the target array has ANY of these tags
        // PostgREST syntax for array overlaps: overlaps.{val1,val2}
        .overlaps(noteType, tags)
        .limit(10);

    if (error) {
        console.error(`Error fetching products by ${noteType}:`, error);
        return [];
    }

    return data || [];
}
