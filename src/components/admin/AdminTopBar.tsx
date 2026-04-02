"use client";

import CurrencySwitcher from "@/components/CurrencySwitcher";
import { usePathname } from "next/navigation";

export default function AdminTopBar() {
    const pathname = usePathname();
    
    // Get page title from pathname
    const getPageTitle = (path: string) => {
        const segments = path.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (!lastSegment || lastSegment === 'admin') return 'لوحة التحكم';
        
        const titles: Record<string, string> = {
            dashboard: 'نظرة عامة',
            orders: 'الطلبات',
            products: 'المنتجات',
            customers: 'العملاء',
            inventory: 'المخزون',
            coupons: 'الكوبونات',
            settings: 'الإعدادات',
            analytics: 'التحليلات',
            notifications: 'التنبيهات'
        };
        
        return titles[lastSegment] || lastSegment;
    };

    return (
        <header 
            className="h-16 flex items-center justify-between px-8 border-b border-white/[0.05] sticky top-0 z-30"
            style={{ background: 'rgba(13, 9, 5, 0.8)', backdropFilter: 'blur(12px)' }}
        >
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-serif text-[#D4AF37]">
                    {getPageTitle(pathname)}
                </h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/30">العملة الحالية</span>
                    <CurrencySwitcher />
                </div>
            </div>
        </header>
    );
}
