"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    supabase, isSupabaseConfigured,
    uploadPerfumeImage,
    fetchPerfumes, createPerfume, updatePerfume, deletePerfume,
    type PerfumeRecord,
} from "@/lib/supabase";

const AUTH_KEY = "edma-admin-auth";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = Omit<PerfumeRecord, "id" | "created_at">;
const EMPTY_FORM: FormData = {
    name_en: "", name_ar: "", price_sar: 0,
    description_en: "", description_ar: "",
    notes_en: [], notes_ar: [],
    image_url: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function GoldSpinner({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: "0.8s" }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#C9A84C" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="px-5 py-4 rounded-xl bg-[#1A0E08] border border-[#C9A84C]/10 flex flex-col gap-1">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#8B7355]">{label}</p>
            <p className="font-serif text-2xl text-[#C9A84C] font-light">{value}</p>
            {sub && <p className="font-sans text-[10px] text-[#5C4033]">{sub}</p>}
        </div>
    );
}

// ─── Image upload zone ────────────────────────────────────────────────────────
function ImageUpload({
    currentUrl, onUploaded, onError,
}: {
    currentUrl: string | null;
    onUploaded: (url: string) => void;
    onError:    (msg: string) => void;
}) {
    const inputRef  = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    async function handleFile(file: File) {
        if (!file.type.startsWith("image/")) { onError("Please upload an image file."); return; }
        if (file.size > 5 * 1024 * 1024) { onError("Image must be under 5 MB."); return; }

        setUploading(true);
        const url = await uploadPerfumeImage(file);
        setUploading(false);

        if (url) onUploaded(url);
        else onError("Upload failed. Check Supabase storage bucket permissions.");
    }

    return (
        <div
            className={`relative flex flex-col items-center justify-center gap-2 w-full h-36 rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer overflow-hidden
                ${isDragging ? "border-[#C9A84C]/60 bg-[#C9A84C]/5" : "border-[#C9A84C]/20 hover:border-[#C9A84C]/40 bg-[#0A0806]"}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
            }}
        >
            {currentUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={currentUrl} alt="Product" className="absolute inset-0 w-full h-full object-contain p-2" />
            ) : uploading ? (
                <>
                    <GoldSpinner size={24} />
                    <p className="font-sans text-[10px] uppercase tracking-wider text-[#8B7355]">Uploading...</p>
                </>
            ) : (
                <>
                    <svg className="w-6 h-6 text-[#C9A84C]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="font-sans text-[10px] text-[#8B7355]">Drag &amp; drop or click to upload</p>
                    <p className="font-sans text-[9px] text-[#5C4033]">PNG, JPG, WEBP up to 5 MB</p>
                </>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
            }} />
        </div>
    );
}

// ─── Product form panel ────────────────────────────────────────────────────────
function ProductFormPanel({
    initial, onSave, onClose, saving,
}: {
    initial:  FormData;
    onSave:   (data: FormData) => void;
    onClose:  () => void;
    saving:   boolean;
}) {
    const [form,     setForm]     = useState<FormData>(initial);
    const [formErr,  setFormErr]  = useState<string | null>(null);
    const [notesEnStr, setNotesEnStr] = useState(initial.notes_en.join(", "));
    const [notesArStr, setNotesArStr] = useState(initial.notes_ar.join(", "));

    function set<K extends keyof FormData>(key: K, value: FormData[K]) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name_en.trim() || !form.name_ar.trim() || form.price_sar <= 0) {
            setFormErr("Name (EN/AR) and price are required.");
            return;
        }
        setFormErr(null);
        const notes_en = notesEnStr.split(",").map(s => s.trim()).filter(Boolean);
        const notes_ar = notesArStr.split(",").map(s => s.trim()).filter(Boolean);
        onSave({ ...form, notes_en, notes_ar });
    }

    const fieldCls = "w-full px-4 py-2.5 rounded-lg bg-[#0A0806] border border-[#C9A84C]/15 text-[#EBE5D9] text-sm placeholder:text-[#3D2B1F] focus:outline-none focus:border-[#C9A84C]/45 transition-colors duration-200";
    const labelCls = "font-sans text-[9px] uppercase tracking-[0.22em] text-[#8B7355]";

    return (
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#0D0A07] border-l border-[#C9A84C]/10 shadow-[-30px_0_80px_rgba(0,0,0,0.5)] z-50 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-[#C9A84C]/10">
                <h2 className="font-serif text-lg text-[#EBE5D9] font-light tracking-wide">
                    {initial.name_en ? "Edit Product" : "New Product"}
                </h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-[#C9A84C]/15 text-[#EBE5D9]/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-5">
                {/* Image */}
                <div className="flex flex-col gap-2">
                    <label className={labelCls}>Product Image</label>
                    <ImageUpload
                        currentUrl={form.image_url}
                        onUploaded={url => set("image_url", url)}
                        onError={setFormErr}
                    />
                    {form.image_url && (
                        <button type="button" onClick={() => set("image_url", null)}
                            className="font-sans text-[10px] text-red-400/60 hover:text-red-400 text-left transition-colors">
                            Remove image
                        </button>
                    )}
                </div>

                {/* Name EN / AR */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>Name (English)</label>
                        <input value={form.name_en} onChange={e => set("name_en", e.target.value)} placeholder="Elinor" className={fieldCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className={labelCls}>الاسم (عربي)</label>
                        <input dir="rtl" value={form.name_ar} onChange={e => set("name_ar", e.target.value)} placeholder="إلينور" className={fieldCls} />
                    </div>
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Price (SAR)</label>
                    <input
                        type="number" min="1" value={form.price_sar || ""}
                        onChange={e => set("price_sar", parseInt(e.target.value) || 0)}
                        placeholder="450"
                        className={fieldCls}
                    />
                </div>

                {/* Description EN / AR */}
                <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Description (English)</label>
                    <textarea rows={3} value={form.description_en} onChange={e => set("description_en", e.target.value)}
                        placeholder="A rare oud opening..." className={`${fieldCls} resize-none`} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>الوصف (عربي)</label>
                    <textarea dir="rtl" rows={3} value={form.description_ar} onChange={e => set("description_ar", e.target.value)}
                        placeholder="فتح العود النادر..." className={`${fieldCls} resize-none`} />
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>Fragrance Notes (EN) — comma separated</label>
                    <input value={notesEnStr} onChange={e => setNotesEnStr(e.target.value)} placeholder="Oud, Rose, Amber" className={fieldCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className={labelCls}>العطر (مفصولة بفواصل)</label>
                    <input dir="rtl" value={notesArStr} onChange={e => setNotesArStr(e.target.value)} placeholder="عود، ورد، عنبر" className={fieldCls} />
                </div>

                {/* Error */}
                <AnimatePresence>
                    {formErr && (
                        <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="font-sans text-xs text-red-400 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                            {formErr}
                        </motion.p>
                    )}
                </AnimatePresence>
            </form>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-[#C9A84C]/10 flex gap-3">
                <button type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-full border border-[#C9A84C]/20 text-[#C9A84C]/70 hover:border-[#C9A84C]/40 hover:text-[#C9A84C] font-sans text-xs uppercase tracking-wider transition-colors">
                    Cancel
                </button>
                <button
                    onClick={handleSubmit as unknown as React.MouseEventHandler}
                    disabled={saving}
                    className="flex-1 relative py-3 rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,168,76,0.3)] disabled:opacity-50"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#C9A84C] to-[#E5C84A]" />
                    <span className="relative flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-wider text-[#0D0A07] font-semibold">
                        {saving && <GoldSpinner size={14} />}
                        {saving ? "Saving..." : "Save Product"}
                    </span>
                </button>
            </div>
        </motion.div>
    );
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────
function DeleteDialog({ name, onConfirm, onCancel, loading }: {
    name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
        >
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-sm bg-[#0D0A07] border border-[#C9A84C]/15 rounded-2xl p-7 flex flex-col gap-5 shadow-[0_0_60px_rgba(0,0,0,0.6)]"
            >
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full border border-red-500/30 flex items-center justify-center text-red-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </div>
                    <p className="font-serif text-lg text-[#EBE5D9] font-light">Delete product?</p>
                    <p className="font-sans text-sm text-[#8B7355]">
                        <span className="text-[#EBE5D9]">{name}</span> will be permanently removed.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-full border border-[#C9A84C]/20 text-[#C9A84C]/70 hover:border-[#C9A84C]/40 font-sans text-xs uppercase tracking-wider transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className="flex-1 py-2.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 font-sans text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading && <GoldSpinner size={14} />}
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const router = useRouter();
    const [perfumes,     setPerfumes]     = useState<PerfumeRecord[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState<string | null>(null);
    const [formOpen,     setFormOpen]     = useState(false);
    const [editTarget,   setEditTarget]   = useState<PerfumeRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<PerfumeRecord | null>(null);
    const [saving,       setSaving]       = useState(false);
    const [deleting,     setDeleting]     = useState(false);
    const [toast,        setToast]        = useState<{ msg: string; type: "ok" | "err" } | null>(null);

    // Auth guard
    useEffect(() => {
        if (sessionStorage.getItem(AUTH_KEY) !== "true") {
            router.replace("/admin");
        }
    }, [router]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setPerfumes(await fetchPerfumes());
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to load products.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    function showToast(msg: string, type: "ok" | "err" = "ok") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    async function handleSave(data: FormData) {
        setSaving(true);
        try {
            if (editTarget) {
                const updated = await updatePerfume(editTarget.id, data);
                setPerfumes(prev => prev.map(p => p.id === updated.id ? updated : p));
                showToast("Product updated.");
            } else {
                const created = await createPerfume(data);
                setPerfumes(prev => [created, ...prev]);
                showToast("Product created.");
            }
            setFormOpen(false);
            setEditTarget(null);
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Save failed.", "err");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deletePerfume(deleteTarget.id);
            setPerfumes(prev => prev.filter(p => p.id !== deleteTarget.id));
            showToast("Product deleted.");
            setDeleteTarget(null);
        } catch (e) {
            showToast(e instanceof Error ? e.message : "Delete failed.", "err");
        } finally {
            setDeleting(false);
        }
    }

    function signOut() {
        sessionStorage.removeItem(AUTH_KEY);
        router.push("/admin");
    }

    const avgPrice = perfumes.length
        ? Math.round(perfumes.reduce((s, p) => s + p.price_sar, 0) / perfumes.length)
        : 0;

    return (
        <main className="min-h-screen bg-[#0A0806] text-[#EBE5D9]">
            {/* ── Top bar ──────────────────────────────────────────────────── */}
            <header className="border-b border-[#C9A84C]/10 px-6 md:px-10 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="font-serif text-xl text-[#EBE5D9] tracking-[0.25em] font-light">EDMA</span>
                    <span className="h-5 w-px bg-[#C9A84C]/20" />
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#8B7355]">Admin Dashboard</span>
                </div>
                <button onClick={signOut}
                    className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-wider text-[#8B7355] hover:text-[#C9A84C] transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                </button>
            </header>

            <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 flex flex-col gap-8">

                {/* ── Supabase not configured warning ────────────────────────── */}
                {!isSupabaseConfigured && (
                    <div className="flex items-start gap-4 px-5 py-4 rounded-xl bg-amber-500/8 border border-amber-500/25">
                        <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                        </svg>
                        <div>
                            <p className="font-sans text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Supabase Not Configured</p>
                            <p className="font-sans text-xs text-amber-300/70 leading-relaxed">
                                Add <code className="font-mono bg-amber-500/10 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                                <code className="font-mono bg-amber-500/10 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your .env.local.
                                See <code className="font-mono bg-amber-500/10 px-1 rounded">src/lib/supabase.ts</code> for the required SQL schema.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Stats row ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Products"    value={perfumes.length} sub="in catalogue" />
                    <StatCard label="Avg Price"   value={avgPrice ? `${avgPrice} SAR` : "—"} />
                    <StatCard label="Database"    value={isSupabaseConfigured ? "Connected" : "Local"} sub={isSupabaseConfigured ? "Supabase" : "Not configured"} />
                    <StatCard label="Last Sync"   value={loading ? "..." : "Live"} sub={error ? "Error" : "Real-time"} />
                </div>

                {/* ── Products table ──────────────────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="font-serif text-xl text-[#EBE5D9] font-light tracking-wide">Products</h2>
                            {!loading && (
                                <span className="px-2.5 py-1 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 font-sans text-[10px] text-[#C9A84C] tracking-wider">
                                    {perfumes.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => { setEditTarget(null); setFormOpen(true); }}
                            disabled={!isSupabaseConfigured}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors font-sans text-xs uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Product
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="font-sans text-xs">{error}</span>
                            <button onClick={load} className="ml-auto font-sans text-xs text-[#C9A84C] underline underline-offset-2">Retry</button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 py-16 text-[#8B7355]">
                            <GoldSpinner size={20} />
                            <span className="font-sans text-xs uppercase tracking-wider">Loading products...</span>
                        </div>
                    ) : perfumes.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <svg className="w-10 h-10 text-[#C9A84C]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="font-serif text-lg text-[#EBE5D9] font-light">No products yet</p>
                            <p className="font-sans text-xs text-[#8B7355]">Click &ldquo;Add Product&rdquo; to create your first perfume.</p>
                        </div>
                    ) : (
                        /* Products grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {perfumes.map((p, i) => (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05, duration: 0.4 }}
                                        className="group flex flex-col bg-[#0D0A07] border border-[#C9A84C]/10 rounded-2xl overflow-hidden hover:border-[#C9A84C]/25 transition-colors duration-300"
                                    >
                                        {/* Image */}
                                        <div className="relative h-44 bg-[#1A0E08] flex items-center justify-center overflow-hidden">
                                            {p.image_url ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={p.image_url} alt={p.name_en} className="w-full h-full object-contain p-4" />
                                            ) : (
                                                <svg className="w-12 h-12 text-[#C9A84C]/15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                            {/* Action buttons overlay */}
                                            <div className="absolute inset-0 bg-[#0D0A07]/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => { setEditTarget(p); setFormOpen(true); }}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-sans uppercase tracking-wider hover:bg-[#C9A84C]/15 transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(p)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-500/30 text-red-400 text-xs font-sans uppercase tracking-wider hover:bg-red-500/15 transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="px-5 py-4 flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-serif text-base text-[#EBE5D9] font-light">{p.name_en}</p>
                                                    <p className="font-sans text-[10px] text-[#8B7355] tracking-wider" dir="rtl">{p.name_ar}</p>
                                                </div>
                                                <span className="font-sans text-sm text-[#C9A84C] tabular-nums flex-shrink-0">{p.price_sar} SAR</span>
                                            </div>
                                            {p.notes_en.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {p.notes_en.slice(0, 3).map(n => (
                                                        <span key={n} className="font-sans text-[9px] uppercase tracking-wider text-[#8B7355] border border-[#C9A84C]/10 px-2 py-0.5 rounded-full">
                                                            {n}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Form panel ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {formOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                            onClick={() => setFormOpen(false)}
                        />
                        <ProductFormPanel
                            initial={editTarget ? {
                                name_en: editTarget.name_en, name_ar: editTarget.name_ar,
                                price_sar: editTarget.price_sar,
                                description_en: editTarget.description_en,
                                description_ar: editTarget.description_ar,
                                notes_en: editTarget.notes_en,
                                notes_ar: editTarget.notes_ar,
                                image_url: editTarget.image_url,
                            } : EMPTY_FORM}
                            onSave={handleSave}
                            onClose={() => setFormOpen(false)}
                            saving={saving}
                        />
                    </>
                )}
            </AnimatePresence>

            {/* ── Delete dialog ────────────────────────────────────────────── */}
            <AnimatePresence>
                {deleteTarget && (
                    <DeleteDialog
                        name={deleteTarget.name_en}
                        onConfirm={handleDelete}
                        onCancel={() => setDeleteTarget(null)}
                        loading={deleting}
                    />
                )}
            </AnimatePresence>

            {/* ── Toast notification ───────────────────────────────────────── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 10, x: "-50%" }}
                        className={`fixed bottom-8 left-1/2 px-5 py-3 rounded-full border font-sans text-xs uppercase tracking-wider z-[100] ${
                            toast.type === "ok"
                                ? "bg-[#0D0A07] border-[#C9A84C]/30 text-[#C9A84C]"
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                        }`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
