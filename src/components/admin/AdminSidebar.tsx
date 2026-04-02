'use client';

import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { useNotifications } from '@/hooks/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';

const NAV = [
    { href: '/admin/dashboard', label: 'نظرة عامة', icon: IconGrid },
    { href: '/admin/accounting', label: 'المحاسبة', icon: IconCalculator },
    { href: '/admin/orders', label: 'الطلبات', icon: IconOrders },
    { href: '/admin/products', label: 'المنتجات', icon: IconBox },
    { href: '/admin/coupons', label: 'الكوبونات', icon: IconTicket },
    { href: '/admin/customers', label: 'العملاء', icon: IconUsers },
    { href: '/admin/inventory', label: 'المخزون', icon: IconChart },
    { href: '/admin/analytics', label: 'التحليلات', icon: IconAnalytics },
    { href: '/admin/settings', label: 'الإعدادات', icon: IconGear },
] as const;

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    const { unreadCount, activeToast, setActiveToast } = useNotifications({ enableToast: true });

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/admin/login');
        router.refresh();
    }

    return (
        <aside
            className="flex flex-col h-screen sticky top-0 flex-shrink-0"
            style={{ width: 240, background: '#080604', borderLeft: '1px solid rgba(212,175,55,0.08)' }}
        >
            {/* Brand */}
            <div className="px-6 pt-8 pb-6" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                <p className="font-serif text-2xl tracking-[0.2em]" style={{ color: '#D4AF37' }}>EDMA</p>
                <p className="text-xs tracking-widest mt-1" style={{ color: 'rgba(212,175,55,0.4)' }}>لوحة التحكم</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <a
                            key={href}
                            href={href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 select-none"
                            style={{
                                color: active ? '#D4AF37' : 'rgba(235,229,217,0.55)',
                                background: active ? 'rgba(212,175,55,0.08)' : 'transparent',
                                borderRight: active ? '2px solid #D4AF37' : '2px solid transparent',
                            }}
                        >
                            <Icon size={17} />
                            <span>{label}</span>
                        </a>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-6 space-y-1" style={{ borderTop: '1px solid rgba(212,175,55,0.08)', paddingTop: 12 }}>
                {/* Notifications */}
                <a
                    href="/admin/notifications"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${activeToast ? 'animate-pulse bg-[#C9A84C]/10' : ''}`}
                    style={{ color: 'rgba(235,229,217,0.55)' }}
                >
                    <span className="relative">
                        <IconBell size={17} />
                        {unreadCount > 0 && (
                            <span
                                className="absolute -top-1.5 -left-1.5 flex items-center justify-center rounded-full text-[9px] font-bold"
                                style={{ width: 16, height: 16, background: '#D4AF37', color: '#0d0905' }}
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </span>
                    <span className={activeToast ? 'text-[#D4AF37]' : ''}>الإشعارات</span>
                </a>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-right"
                    style={{ color: 'rgba(235,229,217,0.4)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(235,229,217,0.4)')}
                >
                    <IconLogout size={17} />
                    <span>تسجيل الخروج</span>
                </button>
            </div>

            {/* Global Admin Toast */}
            <AnimatePresence>
                {activeToast && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[9999] bg-[#0d0905] border border-[#C9A84C]/30 shadow-2xl rounded-xl p-4 flex gap-4 items-start w-[320px]"
                        dir="rtl"
                    >
                        <div className="flex-shrink-0 text-[#C9A84C] mt-0.5">
                            <IconBell size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-[#EBE5D9] font-arabic font-semibold text-sm mb-1 truncate">{activeToast.title}</h4>
                            {activeToast.body && <p className="text-[#EBE5D9]/70 font-arabic text-xs line-clamp-2 leading-relaxed">{activeToast.body}</p>}
                        </div>
                        <button onClick={() => setActiveToast(null)} className="text-white/30 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </aside>
    );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function IconGrid({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}
function IconOrders({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>;
}
function IconBox({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>;
}
function IconUsers({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconChart({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}
function IconGear({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function IconAnalytics({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function IconBell({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function IconLogout({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
}
function IconTicket({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2" /><path d="M15 11v2" /><path d="M15 17v2" /><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" /></svg>;
}

function IconCalculator({ size = 18 }: { size?: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="16" y1="14" x2="16" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>;
}
