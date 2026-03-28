/**
 * Server-safe product catalogue.
 * Prices are the source of truth for all API-side calculations —
 * the client never dictates what it pays.
 */
export interface ServerProduct {
    id:         string;
    name:       { en: string; ar: string };
    priceValue: number; // SAR integer
}

export const SERVER_PRODUCTS: Record<string, ServerProduct> = {
    elinor: { id: "elinor", priceValue: 450, name: { en: "Elinor",  ar: "إلينور" } },
    velour: { id: "velour", priceValue: 380, name: { en: "VELOUR",  ar: "فيلور"  } },
    cecily: { id: "cecily", priceValue: 320, name: { en: "CECILY",  ar: "سيسيلي" } },
};

export function lookupPrice(productId: string): number {
    return SERVER_PRODUCTS[productId]?.priceValue ?? 0;
}
