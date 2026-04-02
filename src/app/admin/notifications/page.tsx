"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";

type FilterTab = "الكل" | "غير مقروء" | "الطلبات" | "المخزون";

const ICONS: Record<string, { emoji: string, color: string }> = {
    new_order: { emoji: "📦", color: "bg-[#C9A84C]/10 text-[#C9A84C]" },
    low_stock: { emoji: "⚠️", color: "bg-amber-500/10 text-amber-500" },
    new_customer: { emoji: "👤", color: "bg-teal-500/10 text-teal-500" },
    order_delivered: { emoji: "✓", color: "bg-green-500/10 text-green-500" },
    vip_order: { emoji: "⭐", color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
    system: { emoji: "ℹ️", color: "bg-blue-500/10 text-blue-500" }
};

export default function NotificationsPage() {
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllRead
    } = useNotifications({ enableToast: false });

    const [activeTab, setActiveTab] = useState<FilterTab>("الكل");

    const filtered = notifications.filter(n => {
        if (activeTab === "غير مقروء") return !n.is_read;
        if (activeTab === "الطلبات") return ["new_order", "order", "order_delivered", "vip_order"].includes(n.type as string);
        if (activeTab === "المخزون") return ["low_stock", "stock"].includes(n.type as string);
        return true;
    });

    const handleItemClick = (id: string, is_read: boolean, link?: string | null) => {
        if (!is_read) markAsRead(id);
        if (link) {
            // Delay navigation slightly if marking as read so mutation fires 
            window.location.href = link;
        }
    };

    return (
        <div className="min-h-screen pb-32" dir="rtl">
            {/* Header */}
            <div className="mb-8 md:flex items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-light font-arabic text-[#EBE5D9]">الإشعارات</h1>
                    {unreadCount > 0 && (
                        <span className="bg-[#C9A84C]/20 text-[#D4AF37] text-sm font-bold px-3 py-1 rounded-full">
                            {unreadCount} غير مقروء
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="bg-white/5 hover:bg-white/10 text-[#EBE5D9] px-4 py-2.5 rounded-xl font-arabic text-sm transition-all shadow-sm"
                    >
                        تحديد الكل كمقروء
                    </button>
                    <button
                        onClick={deleteAllRead}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl font-arabic text-sm transition-all shadow-sm"
                    >
                        حذف المقروءة
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbars mb-6 border-b border-[#C9A84C]/10">
                {(["الكل", "غير مقروء", "الطلبات", "المخزون"] as FilterTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 font-arabic text-sm tracking-wide whitespace-nowrap transition-colors relative ${activeTab === tab ? "text-[#C9A84C]" : "text-[#EBE5D9]/50 hover:text-[#EBE5D9]"
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="notifTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-[#120e08]/50 border border-white/5 rounded-2xl p-16 text-center"
                        >
                            <span className="text-4xl block mb-4 opacity-50">📭</span>
                            <h3 className="text-[#EBE5D9] font-arabic text-lg font-medium mb-1">لا توجد إشعارات</h3>
                            <p className="text-[#EBE5D9]/50 font-arabic text-sm">أنت على اطلاع بكل ما هو جديد</p>
                        </motion.div>
                    ) : (
                        filtered.map((item) => {
                            const iconData = ICONS[item.type] || ICONS.system;
                            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ar });

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`relative bg-[#120e08] border ${!item.is_read ? 'border-[#C9A84C]/30' : 'border-white/5 hover:border-white/10'} rounded-2xl p-4 md:p-5 flex gap-4 transition-colors cursor-pointer group shadow-sm`}
                                    onClick={(e) => {
                                        // Ignore clicks on the delete button
                                        if ((e.target as HTMLElement).closest('button[data-delete]')) return;
                                        handleItemClick(item.id, item.is_read, item.type);
                                    }}
                                >
                                    {/* Unread dot */}
                                    {!item.is_read && (
                                        <span className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#C9A84C]" />
                                    )}

                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl mr-2 md:mr-4 ${iconData.color}`}>
                                        {iconData.emoji}
                                    </div>

                                    {/* Content (with margin to avoid dot) */}
                                    <div className="flex-1 min-w-0 pr-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm md:text-base font-arabic truncate pr-4 ${!item.is_read ? 'text-[#EBE5D9] font-bold' : 'text-[#EBE5D9]/80 font-medium'}`}>
                                                {item.title}
                                            </h4>
                                            <span className="flex-shrink-0 text-xs text-[#EBE5D9]/40 font-arabic whitespace-nowrap pl-6">
                                                {timeAgo}
                                            </span>
                                        </div>
                                        {item.body && (
                                            <p className={`text-sm font-arabic line-clamp-2 leading-relaxed ${!item.is_read ? 'text-[#EBE5D9]/80' : 'text-[#EBE5D9]/50'}`}>
                                                {item.body}
                                            </p>
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        data-delete
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(item.id);
                                        }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                                        aria-label="حذف الإشعار"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
