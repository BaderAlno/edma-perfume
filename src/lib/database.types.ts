// ─────────────────────────────────────────────────────────────────────────────
// EDMA Perfume — Supabase Database Types
// Auto-generated shape: mirrors the SQL schema exactly.
// Re-generate with:  npx supabase gen types typescript --project-id <ref>
// ─────────────────────────────────────────────────────────────────────────────

// ── Column-level enums ────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type OrderSource = 'website' | 'whatsapp' | 'instagram';
export type CouponType = 'percentage' | 'fixed';
export type NotifType = 'order' | 'stock' | 'system';

// ── Row shapes ────────────────────────────────────────────────────────────────

export interface ProductRow {
    id: string;           // uuid
    name: string;
    name_ar: string;
    description_en: string | null;
    description_ar: string | null;
    price_sar: number;           // numeric(10,2)
    stock_quantity: number;           // integer, default 0
    low_stock_threshold: number;           // integer, default 10
    image_url: string | null;
    is_active: boolean;          // default true
    top_notes: string[] | null;
    heart_notes: string[] | null;
    base_notes: string[] | null;
    created_at: string;           // timestamptz
}

export interface CustomerRow {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    city: string | null;
    country: string;                  // default 'SA'
    total_orders: number;                  // integer, default 0
    total_spent: number;                  // numeric(12,2), default 0
    notes: string | null;           // admin-only private notes
    segment: 'vip' | 'active' | 'inactive'; // auto-computed by trigger
    last_order_at: string | null;           // updated by trigger on delivery
    created_at: string;
}

export interface OrderRow {
    id: string;
    order_number: string;                  // unique, e.g. #1047
    customer_id: string | null;           // FK → customers.id
    product_id: string | null;           // FK → products.id
    quantity: number;
    total_amount: number;
    status: OrderStatus;
    source: OrderSource;
    notes: string | null;
    payment_method?: string | null;
    payment_status?: string | null;
    payment_id?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CouponRow {
    id: string;
    code: string;                   // unique, e.g. EDMA20
    type: CouponType;
    value: number;                   // % or fixed SAR amount
    min_order: number | null;            // minimum cart value to apply
    max_uses: number | null;            // null = unlimited
    uses_count: number;                   // default 0
    expires_at: string | null;            // timestamptz
    is_active: boolean;                  // default true
}

export interface NotificationRow {
    id: string;
    title: string;
    body: string | null;
    type: NotifType;
    is_read: boolean;                   // default false
    created_at: string;
}

export interface InventoryLogRow {
    id: string;
    product_id: string | null;          // FK → products.id
    change_amount: number;                 // positive = in, negative = out
    reason: string | null;
    balance_after: number | null;          // stock level after this change
    created_at: string;
}

// ── Insert shapes (fields with DB defaults are optional) ─────────────────────

export type ProductInsert = {
    name: string;
    name_ar: string;
    description_en?: string | null;
    description_ar?: string | null;
    price_sar: number;
    stock_quantity?: number;           // default 0
    low_stock_threshold?: number;          // default 10
    image_url?: string | null;
    is_active?: boolean;          // default true
    top_notes?: string[] | null;
    heart_notes?: string[] | null;
    base_notes?: string[] | null;
};
export type CustomerInsert = {
    name: string;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    country?: string;                 // default 'SA'
    total_orders?: number;                 // default 0
    total_spent?: number;                 // default 0
    notes?: string | null;
    segment?: 'vip' | 'active' | 'inactive'; // default 'inactive'
    last_order_at?: string | null;
};
export type OrderInsert = {
    order_number: string;
    customer_id?: string | null;
    product_id?: string | null;
    quantity: number;
    total_amount: number;
    status?: OrderStatus;             // default 'pending'
    source: OrderSource;
    notes?: string | null;
};
export type CouponInsert = Omit<CouponRow, 'id'>;
export type NotificationInsert = {
    title: string;
    body?: string | null;
    type: NotifType;
    is_read?: boolean;                     // default false
};
export type InventoryLogInsert = {
    product_id?: string | null;
    change_amount: number;
    reason?: string | null;
    balance_after?: number | null;
};

// ── Update shapes ─────────────────────────────────────────────────────────────

export type ProductUpdate = Partial<ProductInsert>;
export type CustomerUpdate = Partial<CustomerInsert>;
export type OrderUpdate = Partial<Pick<OrderRow, 'status' | 'notes' | 'quantity' | 'total_amount'>>;
export type CouponUpdate = Partial<Omit<CouponRow, 'id'>>;
export type NotificationUpdate = Partial<Pick<NotificationRow, 'is_read'>>;

// ── Joined / enriched shapes ──────────────────────────────────────────────────

export interface OrderWithDetails extends OrderRow {
    customer_name: string | null;
    customer_phone: string | null;
    product_name: string | null;
    product_name_ar: string | null;
}

export interface ProductWithStockStatus extends ProductRow {
    /** Derived client-side from stock_quantity vs low_stock_threshold */
    stock_status: 'ok' | 'low' | 'critical';
}

// ── Supabase Database shape (for createClient<Database>) ─────────────────────

export type Database = {
    public: {
        Tables: {
            products: {
                Row: ProductRow;
                Insert: ProductInsert;
                Update: ProductUpdate;
                Relationships: [];
            };
            customers: {
                Row: CustomerRow;
                Insert: CustomerInsert;
                Update: CustomerUpdate;
                Relationships: [];
            };
            orders: {
                Row: OrderRow;
                Insert: OrderInsert;
                Update: OrderUpdate;
                Relationships: [];
            };
            coupons: {
                Row: CouponRow;
                Insert: CouponInsert;
                Update: CouponUpdate;
                Relationships: [];
            };
            notifications: {
                Row: NotificationRow;
                Insert: NotificationInsert;
                Update: NotificationUpdate;
                Relationships: [];
            };
            inventory_logs: {
                Row: InventoryLogRow;
                Insert: InventoryLogInsert;
                Update: Partial<InventoryLogInsert>;
                Relationships: [];
            };
        };
        Views: { [_ in never]: never };
        Functions: { [_ in never]: never };
        Enums: {
            order_status: OrderStatus;
            order_source: OrderSource;
            coupon_type: CouponType;
            notif_type: NotifType;
        };
        CompositeTypes: { [_ in never]: never };
    };
};
