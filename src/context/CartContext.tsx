"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from "react";
// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Minimal shape required to add an item to the cart.
 * Accepts both the static translations products (priceValue) and
 * Supabase ProductForShop records (price_sar).
 */
export interface AddableProduct {
    id: string;
    name: { en: string; ar: string };
    /** Numeric SAR price — Supabase products */
    price_sar?: number;
    /** Numeric SAR price — translations/legacy products */
    priceValue?: number;
    image: string;
    accent: string;
}

export interface CartItem {
    id: string;
    name: { en: string; ar: string };
    /** SAR price per unit */
    price_sar: number;
    image: string;
    accent: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
}

type CartAction =
    | { type: "ADD"; product: AddableProduct }
    | { type: "REMOVE"; id: string }
    | { type: "UPDATE_QTY"; id: string; delta: number }
    | { type: "CLEAR" }
    | { type: "SET_OPEN"; open: boolean }
    | { type: "HYDRATE"; items: CartItem[] };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
    switch (action.type) {
        case "ADD": {
            const existing = state.items.find(i => i.id === action.product.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map(i =>
                        i.id === action.product.id
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    ),
                };
            }
            const price_sar = action.product.price_sar ?? action.product.priceValue ?? 0;
            return {
                ...state,
                items: [
                    ...state.items,
                    {
                        id: action.product.id,
                        name: action.product.name,
                        price_sar,
                        image: action.product.image,
                        accent: action.product.accent,
                        quantity: 1,
                    },
                ],
            };
        }

        case "REMOVE":
            return { ...state, items: state.items.filter(i => i.id !== action.id) };

        case "UPDATE_QTY": {
            const updated = state.items
                .map(i => i.id === action.id ? { ...i, quantity: i.quantity + action.delta } : i)
                .filter(i => i.quantity > 0);
            return { ...state, items: updated };
        }

        case "CLEAR":
            return { ...state, items: [] };

        case "SET_OPEN":
            return { ...state, isOpen: action.open };

        case "HYDRATE":
            return { ...state, items: action.items };

        default:
            return state;
    }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    addItem: (product: AddableProduct) => void;
    removeItem: (id: string) => void;
    updateQty: (id: string, delta: number) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    totalItems: number;
    totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "edma-cart-v1";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

    // Hydrate from localStorage once on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsedItems = JSON.parse(raw) as CartItem[];
                // Auto-sanitize: Only keep items with valid UUID format AND valid price
                const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                const isMockUUID = (str: string) => str === '11111111-1111-1111-1111-000000000001' || str === '11111111-1111-1111-1111-000000000002' || str.includes('11111111-');

                const sanitizedItems = parsedItems.filter(item => {
                    const valid = item.id && isUUID(item.id) && !isMockUUID(item.id) && typeof item.price_sar === 'number' && !isNaN(item.price_sar);
                    if (!valid) console.warn(`[CART SANITIZE] Removing invalid/legacy/mock item:`, item);
                    return valid;
                });

                dispatch({ type: "HYDRATE", items: sanitizedItems });

                // If we had to sanitize, rewrite storage immediately
                if (sanitizedItems.length !== parsedItems.length) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedItems));
                }
            }
        } catch {
            // ignore parse errors — start with empty cart
        }
    }, []);

    // Persist items (not drawer open state) on every change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
        } catch {
            // ignore write errors (private browsing, full storage)
        }
    }, [state.items]);

    const addItem = useCallback((p: AddableProduct) => dispatch({ type: "ADD", product: p }), []);
    const removeItem = useCallback((id: string) => dispatch({ type: "REMOVE", id }), []);
    const updateQty = useCallback((id: string, delta: number) => dispatch({ type: "UPDATE_QTY", id, delta }), []);
    const clearCart = useCallback(() => dispatch({ type: "CLEAR" }), []);
    const openCart = useCallback(() => dispatch({ type: "SET_OPEN", open: true }), []);
    const closeCart = useCallback(() => dispatch({ type: "SET_OPEN", open: false }), []);

    const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = state.items.reduce((s, i) => s + i.price_sar * i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items: state.items, isOpen: state.isOpen,
            addItem, removeItem, updateQty, clearCart,
            openCart, closeCart, totalItems, totalPrice,
        }}>
            {children}
        </CartContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
    return ctx;
}
