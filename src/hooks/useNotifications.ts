"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { NotificationRow } from "@/lib/database.types";

export interface NotificationsToast {
    id: string;
    title: string;
    body: string | null;
    type: string;
}

export function useNotifications({ enableToast = false }: { enableToast?: boolean } = {}) {
    const supabase = getSupabaseBrowserClient();
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToast, setActiveToast] = useState<NotificationsToast | null>(null);

    // Initial fetch
    useEffect(() => {
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false });

            if (!error && data) {
                setNotifications(data);
                setUnreadCount((data as NotificationRow[]).filter(n => !n.is_read).length);
            }
        };

        fetchNotifications();
    }, [supabase]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel("admin_notifications")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "notifications" },
                (payload) => {
                    const newNotif = payload.new as NotificationRow;
                    setNotifications((prev) => [newNotif, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    if (enableToast) {
                        setActiveToast({
                            id: newNotif.id,
                            title: newNotif.title,
                            body: newNotif.body,
                            type: newNotif.type
                        });

                        // Auto-dismiss toast
                        setTimeout(() => {
                            setActiveToast((current) => current?.id === newNotif.id ? null : current);
                        }, 5000);

                        // Try to play audio
                        try {
                            const audio = new Audio("/notification.mp3");
                            audio.play().catch((err) => {
                                console.warn("Browser blocked notification audio autoplay:", err);
                            });
                        } catch (e) {
                            // Silently ignore strictly blocked environments
                        }
                    }
                }
            )
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "notifications" },
                (payload) => {
                    const updated = payload.new as NotificationRow;
                    setNotifications((prev) => prev.map(n => n.id === updated.id ? updated : n));
                    setUnreadCount((prev) => {
                        // Recalculate precisely or incrementally. Best to just recalcute from current state,
                        // but doing a quick delta is faster.
                        const oldNotif = payload.old as any;
                        if (oldNotif.is_read === false && updated.is_read === true) return Math.max(0, prev - 1);
                        if (oldNotif.is_read === true && updated.is_read === false) return prev + 1;
                        return prev;
                    });
                }
            )
            .on(
                "postgres_changes",
                { event: "DELETE", schema: "public", table: "notifications" },
                (payload) => {
                    const deletedId = payload.old.id;
                    setNotifications((prev) => {
                        const target = prev.find(n => n.id === deletedId);
                        if (target && !target.is_read) {
                            setUnreadCount(c => Math.max(0, c - 1));
                        }
                        return prev.filter(n => n.id !== deletedId);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, enableToast]);

    // Mutators
    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(c => Math.max(0, c - 1));
        await (supabase as any).from("notifications").update({ is_read: true }).eq("id", id);
    }, [supabase]);

    const markAllAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (!unreadIds.length) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        await (supabase as any).from("notifications").update({ is_read: true }).in("id", unreadIds);
    }, [supabase, notifications]);

    const deleteNotification = useCallback(async (id: string) => {
        const isUnread = notifications.find(n => n.id === id && !n.is_read);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (isUnread) setUnreadCount(c => Math.max(0, c - 1));
        await supabase.from("notifications").delete().eq("id", id);
    }, [supabase, notifications]);

    const deleteAllRead = useCallback(async () => {
        const readIds = notifications.filter(n => n.is_read).map(n => n.id);
        if (!readIds.length) return;

        setNotifications(prev => prev.filter(n => !n.is_read));
        await supabase.from("notifications").delete().in("id", readIds);
    }, [supabase, notifications]);

    return {
        notifications,
        unreadCount,
        activeToast,
        setActiveToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllRead
    };
}
