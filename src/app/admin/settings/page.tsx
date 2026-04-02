"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSettings, updateSettings } from "@/lib/actions/settings";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useCurrency } from "@/context/CurrencyContext";

export default function SettingsPage() {
    const router = useRouter();
    const { currency } = useCurrency();
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Profile state
    const [adminEmail, setAdminEmail] = useState("");
    const [passwordData, setPasswordData] = useState({ newPass: "", confirmPass: "" });

    // Danger Zone state
    const [deleteTestText, setDeleteTestText] = useState("");

    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // Fetch settings
                const data = await getSettings();
                setSettings(data);
                setOriginalSettings(data);

                // Fetch admin email
                const { data: authData } = await supabase.auth.getUser();
                if (authData.user?.email) {
                    setAdminEmail(authData.user.email);
                }
            } catch (err) {
                console.error("Error loading settings", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [supabase]);

    const handleChange = (key: string, value: string | boolean) => {
        setSettings(prev => ({
            ...prev,
            [key]: String(value)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Find only changed settings to update
            const changes: Record<string, string> = {};
            for (const key in settings) {
                if (settings[key] !== originalSettings[key]) {
                    changes[key] = settings[key];
                }
            }

            if (Object.keys(changes).length > 0) {
                const success = await updateSettings(changes);
                if (success) {
                    setOriginalSettings(settings);
                    showToast("تم الحفظ بنجاح ✓", "success");
                } else {
                    showToast("حدث خطأ أثناء الحفظ", "error");
                }
            } else {
                showToast("لم يتم إجراء أي تغييرات", "success");
            }
        } catch (err) {
            console.error(err);
            showToast("حدث خطأ أثناء الحفظ", "error");
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.newPass) return;
        if (passwordData.newPass !== passwordData.confirmPass) {
            showToast("كلمات المرور غير متطابقة", "error");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPass
            });
            if (error) throw error;
            showToast("تم تحديث كلمة المرور بنجاح ✓", "success");
            setPasswordData({ newPass: "", confirmPass: "" });
        } catch (err: any) {
            showToast(err.message || "حدث خطأ", "error");
        }
    };

    const handleLogoutGlobal = async () => {
        await supabase.auth.signOut({ scope: "global" });
        router.push("/admin/login");
    };

    const handleDeleteTestOrders = async () => {
        if (deleteTestText !== "حذف") return;
        try {
            const { error } = await supabase
                .from("orders")
                .delete()
                .like("order_number", "#100%");
            if (error) throw error;
            showToast("تم حذف طلبات الاختبار بنجاح", "success");
            setDeleteTestText("");
        } catch (err) {
            showToast("فشل الحذف", "error");
        }
    };

    const handleResetInventory = async () => {
        if (!confirm("هل أنت متأكد من تصفير جميع المخزونات إلى 0؟ هذا الإجراء لا يمكن التراجع عنه.")) return;
        try {
            const { error } = await (supabase as any)
                .from("products")
                .update({ stock_quantity: 0 })
                .neq("id", "00000000-0000-0000-0000-000000000000"); // Dummy condition to update all
            if (error) throw error;
            showToast("تم إعادة تعيين المخزون", "success");
        } catch (err) {
            showToast("فشل إعادة التعيين", "error");
        }
    };

    const handleExport = (type: string) => {
        showToast(`جاري تصدير ${type}... (محاكاة)`, "success");
        // Export logic to be implemented with XLSX or similar
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <svg className="w-8 h-8 animate-spin text-[#C9A84C]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <section className="bg-[#120e08] border border-[#C9A84C]/10 rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A84C]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <h2 className="text-xl font-arabic font-semibold text-[#EBE5D9] mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#C9A84C] rounded-full" />
                {title}
            </h2>
            <div className="space-y-6 relative z-10">{children}</div>
        </section>
    );

    const Input = ({ label, id, value, onChange, placeholder, type = "text" }: any) => (
        <div>
            <label htmlFor={id} className="block text-sm font-arabic text-[#EBE5D9]/70 mb-2">{label}</label>
            <input
                type={type}
                id={id}
                value={value || ""}
                onChange={e => onChange(id, e.target.value)}
                placeholder={placeholder}
                className="w-full bg-[#0d0905] border border-white/10 rounded-xl px-4 py-3 text-[#EBE5D9] font-sans focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                dir={type === 'number' || id.includes('link') || id.includes('email') ? 'ltr' : 'rtl'}
            />
        </div>
    );

    const Textarea = ({ label, id, value, onChange, placeholder }: any) => (
        <div>
            <label htmlFor={id} className="block text-sm font-arabic text-[#EBE5D9]/70 mb-2">{label}</label>
            <textarea
                id={id}
                value={value || ""}
                onChange={e => onChange(id, e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-[#0d0905] border border-white/10 rounded-xl px-4 py-3 text-[#EBE5D9] font-arabic focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                dir="rtl"
            />
        </div>
    );

    const Toggle = ({ label, id, checked, onChange }: any) => (
        <div className="flex items-center justify-between p-4 bg-[#0d0905] border border-white/5 rounded-xl">
            <label htmlFor={id} className="text-sm font-arabic text-[#EBE5D9] cursor-pointer cursor-pointer">{label}</label>
            <button
                type="button"
                role="switch"
                aria-checked={checked === "true"}
                onClick={() => onChange(id, checked === "true" ? "false" : "true")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked === "true" ? "bg-[#C9A84C]" : "bg-white/10"}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked === "true" ? "-translate-x-6" : "-translate-x-1"}`} />
            </button>
        </div>
    );

    return (
        <div className="min-h-screen pb-32" dir="rtl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light font-arabic text-[#EBE5D9]">إعدادات النظام</h1>
                    <p className="text-[#EBE5D9]/50 font-arabic mt-2 text-sm">التحكم الكامل في واجهة وخلفية المتجر</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="hidden md:flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b5953f] text-[#0d0905] px-6 py-2.5 rounded-xl font-arabic font-semibold transition-all disabled:opacity-50"
                >
                    {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
            </div>

            <div className="max-w-4xl space-y-8">
                {/* 1. Store Info */}
                <Section title="معلومات المتجر">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="اسم المتجر" id="store_name" value={settings.store_name} onChange={handleChange} />
                        <Input label="رقم واتساب (للتواصل)" id="contact_whatsapp" value={settings.contact_whatsapp} onChange={handleChange} type="tel" />
                        <Input label="البريد الإلكتروني" id="contact_email" value={settings.contact_email} onChange={handleChange} type="email" />
                        <Input label="رابط انستقرام" id="link_instagram" value={settings.link_instagram} onChange={handleChange} />
                        <Input label="رابط سناب شات" id="link_snapchat" value={settings.link_snapchat} onChange={handleChange} />
                        <Input label="رابط تيك توك" id="link_tiktok" value={settings.link_tiktok} onChange={handleChange} />
                    </div>
                    <Textarea label="وصف المتجر (SEO)" id="store_seo_description" value={settings.store_seo_description} onChange={handleChange} />
                    <Textarea label="العنوان" id="store_address" value={settings.store_address} onChange={handleChange} />
                </Section>

                {/* 2. Currency & Pricing */}
                <Section title="العملة والأسعار">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-arabic text-[#EBE5D9]/70 mb-2">العملة الافتراضية</label>
                            <select
                                value={settings.default_currency || "SAR"}
                                onChange={(e) => handleChange("default_currency", e.target.value)}
                                className="w-full bg-[#0d0905] border border-white/10 rounded-xl px-4 py-3 text-[#EBE5D9] font-sans focus:outline-none focus:border-[#C9A84C]/50"
                                dir="ltr"
                            >
                                <option value="SAR">SAR - ريال سعودي</option>
                                <option value="KWD">KWD - دينار كويتي</option>
                                <option value="USD">USD - دولار أمريكي</option>
                            </select>
                        </div>
                        <Input label={`حد الشحن المجاني (${currency})`} id="free_shipping_threshold" value={settings.free_shipping_threshold} onChange={handleChange} type="number" />
                        <Input label="سعر تحويل الدينار الكويتي (مقابل الريال)" id="rate_kwd" value={settings.rate_kwd} onChange={handleChange} type="number" />
                        <Input label="سعر تحويل الدولار (مقابل الريال)" id="rate_usd" value={settings.rate_usd} onChange={handleChange} type="number" />
                    </div>
                    <Toggle label="عرض الأسعار بعملات متعددة للزوار" id="show_multi_currency" checked={settings.show_multi_currency} onChange={handleChange} />
                </Section>

                {/* 3. Notifications */}
                <Section title="الإشعارات">
                    <Input label="رقم الإدارة (لاستقبال التنبيهات)" id="admin_whatsapp" value={settings.admin_whatsapp} onChange={handleChange} type="tel" placeholder="+9665..." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <Toggle label="إشعار واتساب لطلب جديد" id="notif_whatsapp_order" checked={settings.notif_whatsapp_order} onChange={handleChange} />
                        <Toggle label="إشعار بريد لطلب جديد" id="notif_email_order" checked={settings.notif_email_order} onChange={handleChange} />
                        <Toggle label="تنبيه انخفاض المخزون" id="notif_low_stock" checked={settings.notif_low_stock} onChange={handleChange} />
                        <Toggle label="إرسال تقرير مبيعات يومي" id="notif_daily_report" checked={settings.notif_daily_report} onChange={handleChange} />
                    </div>
                </Section>

                {/* 4. Store Settings */}
                <Section title="إعدادات النظام">
                    <div className="grid grid-cols-1 gap-6">
                        <Input label="نص شريط الإعلانات العلوي" id="announcement_text" value={settings.announcement_text} onChange={handleChange} placeholder="شحن مجاني للطلبات فوق 500 ريال..." />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Toggle label="وضع الصيانة (Maintenance Mode)" id="is_maintenance_mode" checked={settings.is_maintenance_mode} onChange={handleChange} />
                            <Toggle label="السماح بالطلبات الجديدة" id="allow_orders" checked={settings.allow_orders} onChange={handleChange} />
                            <Toggle label="عرض أرقام المخزون للزوار" id="show_inventory_count" checked={settings.show_inventory_count} onChange={handleChange} />
                            <Toggle label="تفعيل نظام الكوبونات" id="enable_coupons" checked={settings.enable_coupons} onChange={handleChange} />
                        </div>
                        <Input label={`الحد الأدنى للطلب (${currency})`} id="min_order_amount" value={settings.min_order_amount} onChange={handleChange} type="number" />
                    </div>
                </Section>

                {/* 5. Account & Security */}
                <Section title="الحساب والأمان">
                    <div className="mb-6 pb-6 border-b border-white/5">
                        <label className="block text-sm font-arabic text-[#EBE5D9]/70 mb-2">حساب المدير الحالي</label>
                        <div className="w-full bg-[#0d0905] border border-white/5 rounded-xl px-4 py-3 text-[#EBE5D9]/50 font-sans cursor-not-allowed" dir="ltr">
                            {adminEmail || "جاري التحميل..."}
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <h4 className="text-sm font-arabic text-[#EBE5D9]">تغيير كلمة المرور</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="password"
                                placeholder="كلمة المرور الجديدة"
                                value={passwordData.newPass}
                                onChange={e => setPasswordData(p => ({ ...p, newPass: e.target.value }))}
                                className="w-full bg-[#0d0905] border border-white/10 rounded-xl px-4 py-3 text-[#EBE5D9] focus:outline-none focus:border-[#C9A84C]/50"
                                dir="ltr"
                            />
                            <input
                                type="password"
                                placeholder="تأكيد كلمة المرور"
                                value={passwordData.confirmPass}
                                onChange={e => setPasswordData(p => ({ ...p, confirmPass: e.target.value }))}
                                className="w-full bg-[#0d0905] border border-white/10 rounded-xl px-4 py-3 text-[#EBE5D9] focus:outline-none focus:border-[#C9A84C]/50"
                                dir="ltr"
                            />
                        </div>
                        <button
                            onClick={handleUpdatePassword}
                            disabled={!passwordData.newPass}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#EBE5D9] px-6 py-2 rounded-lg font-arabic text-sm transition-all disabled:opacity-50"
                        >
                            تحديث كلمة المرور
                        </button>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <button
                            onClick={handleLogoutGlobal}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 font-arabic text-sm transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            تسجيل الخروج من جميع الأجهزة
                        </button>
                    </div>
                </Section>

                {/* 6. Backups */}
                <Section title="النسخ الاحتياطي">
                    <p className="text-[#EBE5D9]/50 font-arabic text-sm mb-4">تنزيل تقارير النظام بصيغة CSV</p>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => handleExport('الطلبات')} className="bg-[#0d0905] border border-white/10 hover:border-[#C9A84C]/30 text-[#EBE5D9] px-6 py-3 rounded-xl font-arabic flex items-center gap-2 transition-all">
                            📦 تصدير الطلبات
                        </button>
                        <button onClick={() => handleExport('العملاء')} className="bg-[#0d0905] border border-white/10 hover:border-[#C9A84C]/30 text-[#EBE5D9] px-6 py-3 rounded-xl font-arabic flex items-center gap-2 transition-all">
                            👥 تصدير العملاء
                        </button>
                        <button onClick={() => handleExport('المنتجات')} className="bg-[#0d0905] border border-white/10 hover:border-[#C9A84C]/30 text-[#EBE5D9] px-6 py-3 rounded-xl font-arabic flex items-center gap-2 transition-all">
                            ✨ تصدير المنتجات
                        </button>
                    </div>
                </Section>

                {/* 7. Danger Zone */}
                <section className="bg-[#120e08]/50 border border-red-500/20 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                    <h2 className="text-xl font-arabic font-semibold text-red-500 mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-red-500 rounded-full" />
                        منطقة الخطر
                    </h2>

                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 items-start justify-between border-b border-red-500/10 pb-6">
                            <div>
                                <h4 className="text-[#EBE5D9] font-arabic mb-1">مسح بيانات الاختبار</h4>
                                <p className="text-sm font-arabic text-[#EBE5D9]/50">حذف جميع الطلبات التي تبدأ بـ #100. اكتب <span className="text-red-400">حذف</span> للتأكيد.</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <input
                                    type="text"
                                    value={deleteTestText}
                                    onChange={e => setDeleteTestText(e.target.value)}
                                    placeholder="اكتب هنا..."
                                    className="bg-[#0d0905] border border-red-500/20 rounded-lg px-3 py-2 text-[#EBE5D9] focus:outline-none focus:border-red-500 w-32"
                                />
                                <button
                                    onClick={handleDeleteTestOrders}
                                    disabled={deleteTestText !== "حذف"}
                                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-arabic transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    حذف الطلبات
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div>
                                <h4 className="text-[#EBE5D9] font-arabic mb-1">إعادة تعيين المخزون</h4>
                                <p className="text-sm font-arabic text-[#EBE5D9]/50">تصفير أرقام المخزون لجميع المنتجات.</p>
                            </div>
                            <button
                                onClick={handleResetInventory}
                                className="w-full md:w-auto bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white px-6 py-2.5 rounded-lg font-arabic transition-all"
                            >
                                تصفير المخزون بالكامل
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Mobile Bottom Save Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-[#120e08]/90 backdrop-blur-md border-t border-[#C9A84C]/10 z-40">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-[#C9A84C] text-[#0d0905] px-6 py-3.5 rounded-xl font-arabic font-semibold shadow-lg shadow-[#C9A84C]/20 transition-all disabled:opacity-50"
                >
                    {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </button>
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl ${toast.type === "success"
                            ? "bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#D4AF37]"
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                            }`}
                        dir="rtl"
                    >
                        {toast.type === "success" ? "✨" : "⚠️"}
                        <span className="font-arabic font-medium truncate">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
