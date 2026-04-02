'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter }                         from 'next/navigation';
import {
    getCustomers,
    getCustomerSegmentCounts,
} from '@/lib/actions/customers';
import type { CustomerAdmin, CustomerSegment, GetCustomersOptions } from '@/lib/actions/customers';
import { useCurrency } from '@/context/CurrencyContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEGMENT_LABEL: Record<CustomerSegment, string> = {
    vip:      'VIP',
    active:   'نشط',
    inactive: 'غير نشط',
};

const SEGMENT_COLOR: Record<CustomerSegment, string> = {
    vip:      '#D4AF37',
    active:   '#4ade80',
    inactive: 'rgba(235,229,217,0.35)',
};

const SEGMENT_BG: Record<CustomerSegment, string> = {
    vip:      'rgba(212,175,55,0.12)',
    active:   'rgba(74,222,128,0.1)',
    inactive: 'rgba(235,229,217,0.06)',
};

const STATUS_COLOR: Record<string, string> = {
    pending:    '#fbbf24',
    processing: '#60a5fa',
    shipped:    '#34d399',
    delivered:  '#4ade80',
    cancelled:  '#ff6b6b',
};

type SortKey = NonNullable<GetCustomersOptions['sortBy']>;

function Spinner() {
    return (
        <svg width={24} height={24} viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2.5" />
            <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
    return (
        <svg
            width={10} height={10} viewBox="0 0 10 10"
            style={{ marginRight: 4, opacity: active ? 1 : 0.25, display: 'inline' }}
        >
            {dir === 'asc' || !active ? (
                <path d="M5 2 L8 7 L2 7 Z" fill="currentColor" opacity={active && dir === 'asc' ? 1 : 0.4} />
            ) : null}
            {dir === 'desc' || !active ? (
                <path d="M5 8 L8 3 L2 3 Z" fill="currentColor" opacity={active && dir === 'desc' ? 1 : 0.4} />
            ) : null}
        </svg>
    );
}

const PAGE_SIZE = 50;

export default function CustomersPage() {
    const router = useRouter();
    const { formatPrice } = useCurrency();

    const [customers, setCustomers] = useState<CustomerAdmin[]>([]);
    const [total,     setTotal]     = useState(0);
    const [counts,    setCounts]    = useState({ total: 0, vip: 0, active: 0, inactive: 0 });
    const [loading,   setLoading]   = useState(true);
    const [page,      setPage]      = useState(1);

    // Filters + sort
    const [search,   setSearch]   = useState('');
    const [segment,  setSegment]  = useState<CustomerSegment | ''>('');
    const [sortBy,   setSortBy]   = useState<SortKey>('total_spent');
    const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('desc');

    // ── Load ───────────────────────────────────────────────────────────────────

    const load = useCallback(async (pg = page) => {
        setLoading(true);
        try {
            const [listRes, countsRes] = await Promise.all([
                getCustomers({ search, segment, sortBy, sortDir, page: pg, limit: PAGE_SIZE }),
                getCustomerSegmentCounts(),
            ]);
            setCustomers(listRes.customers);
            setTotal(listRes.total);
            setCounts(countsRes);
        } finally {
            setLoading(false);
        }
    }, [search, segment, sortBy, sortDir, page]);

    useEffect(() => { load(page); }, [load, page]);
    useEffect(() => { setPage(1); }, [search, segment, sortBy, sortDir]);

    // ── Sort toggle ────────────────────────────────────────────────────────────

    function handleSort(key: SortKey) {
        if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortDir('desc'); }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);

    // ── Render ─────────────────────────────────────────────────────────────────

    const SUMMARY_TILES = [
        { key: '' as const,       label: 'إجمالي العملاء',  value: counts.total,    color: '#60a5fa', icon: <IconUsers /> },
        { key: 'vip' as const,    label: 'عملاء VIP',        value: counts.vip,      color: '#D4AF37', icon: <IconStar  /> },
        { key: 'active' as const, label: 'نشطون (30 يوم)',  value: counts.active,   color: '#4ade80', icon: <IconCheck /> },
        { key: 'inactive' as const,label:'غير نشطين',        value: counts.inactive, color: 'rgba(235,229,217,0.4)', icon: <IconClock /> },
    ];

    return (
        <div className="p-6 space-y-6 max-w-[1400px]" dir="rtl">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-light" style={{ color: '#EBE5D9' }}>العملاء</h1>
                <p className="text-xs mt-1" style={{ color: 'rgba(212,175,55,0.45)' }}>
                    {counts.total.toLocaleString('ar-SA')} عميل مسجّل
                </p>
            </div>

            {/* ── Summary tiles ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {SUMMARY_TILES.map(tile => (
                    <button
                        key={tile.key}
                        onClick={() => setSegment(seg => seg === tile.key ? '' : tile.key)}
                        className="rounded-xl px-4 py-4 text-right transition-all duration-150"
                        style={{
                            background: segment === tile.key
                                ? `${tile.color}18`
                                : '#120e08',
                            border: `1px solid ${segment === tile.key ? `${tile.color}44` : 'rgba(212,175,55,0.08)'}`,
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span style={{ color: tile.color, opacity: 0.7 }}>{tile.icon}</span>
                            {segment === tile.key && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${tile.color}22`, color: tile.color }}>
                                    فلتر نشط
                                </span>
                            )}
                        </div>
                        <p className="text-xs mb-1" style={{ color: 'rgba(212,175,55,0.5)' }}>{tile.label}</p>
                        <p className="tabular-nums text-2xl font-light" style={{ color: tile.color }}>
                            {tile.value.toLocaleString('ar-SA')}
                        </p>
                    </button>
                ))}
            </div>

            {/* ── Filters row ────────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-3 items-center">
                <input
                    type="search"
                    placeholder="بحث بالاسم أو الهاتف أو البريد..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="rounded-lg px-4 py-2 text-sm outline-none"
                    style={{
                        background: '#120e08',
                        border:     '1px solid rgba(212,175,55,0.12)',
                        color:      '#EBE5D9',
                        minWidth:   260,
                    }}
                />
                <select
                    value={segment}
                    onChange={e => setSegment(e.target.value as CustomerSegment | '')}
                    className="rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                        background: '#120e08',
                        border:     '1px solid rgba(212,175,55,0.12)',
                        color:      '#EBE5D9',
                    }}
                >
                    <option value="">كل الشرائح</option>
                    <option value="vip">VIP</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                </select>
                {(search || segment) && (
                    <button
                        onClick={() => { setSearch(''); setSegment(''); }}
                        className="text-xs px-3 py-2 rounded-lg"
                        style={{
                            background: 'rgba(255,107,107,0.08)',
                            border:     '1px solid rgba(255,107,107,0.15)',
                            color:      '#ff6b6b',
                        }}
                    >
                        مسح الفلاتر
                    </button>
                )}
                <span className="text-xs mr-auto" style={{ color: 'rgba(235,229,217,0.3)' }}>
                    {total.toLocaleString('ar-SA')} نتيجة
                </span>
            </div>

            {/* ── Table ──────────────────────────────────────────────────── */}
            <div
                className="rounded-xl overflow-hidden"
                style={{ background: '#120e08', border: '1px solid rgba(212,175,55,0.1)' }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-16"><Spinner /></div>
                ) : customers.length === 0 ? (
                    <div className="text-center py-16 text-sm" style={{ color: 'rgba(235,229,217,0.3)' }}>
                        لا يوجد عملاء مطابقون
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
                                    {/* Non-sortable */}
                                    {['الاسم', 'الهاتف', 'المدينة'].map(h => (
                                        <th key={h} className="px-4 pb-3 pt-4 text-right font-normal text-xs tracking-wider"
                                            style={{ color: 'rgba(212,175,55,0.5)' }}>
                                            {h}
                                        </th>
                                    ))}
                                    {/* Sortable */}
                                    {([
                                        { key: 'total_orders' as SortKey, label: 'الطلبات'   },
                                        { key: 'total_spent'  as SortKey, label: 'الإنفاق'    },
                                        { key: 'last_order_at'as SortKey, label: 'آخر طلب'    },
                                    ]).map(({ key, label }) => (
                                        <th
                                            key={key}
                                            className="px-4 pb-3 pt-4 text-right font-normal text-xs tracking-wider cursor-pointer select-none"
                                            style={{ color: sortBy === key ? '#D4AF37' : 'rgba(212,175,55,0.5)' }}
                                            onClick={() => handleSort(key)}
                                        >
                                            <SortIcon active={sortBy === key} dir={sortDir} />
                                            {label}
                                        </th>
                                    ))}
                                    <th className="px-4 pb-3 pt-4 text-right font-normal text-xs tracking-wider"
                                        style={{ color: 'rgba(212,175,55,0.5)' }}>
                                        الشريحة
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr
                                        key={c.id}
                                        onClick={() => router.push(`/admin/customers/${c.id}`)}
                                        className="cursor-pointer transition-colors duration-100"
                                        style={{ borderBottom: '1px solid rgba(212,175,55,0.05)' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.03)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        {/* Name */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={c.name} segment={c.segment} />
                                                <div>
                                                    <p className="text-sm" style={{ color: '#EBE5D9' }}>{c.name}</p>
                                                    {c.email && (
                                                        <p className="text-xs" style={{ color: 'rgba(235,229,217,0.35)' }}>{c.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Phone */}
                                        <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'rgba(235,229,217,0.55)' }}>
                                            {c.phone ?? '—'}
                                        </td>
                                        {/* City */}
                                        <td className="px-4 py-3 text-xs" style={{ color: 'rgba(235,229,217,0.55)' }}>
                                            {c.city ?? '—'}
                                        </td>
                                        {/* Orders */}
                                        <td className="px-4 py-3 tabular-nums text-center" style={{ color: 'rgba(235,229,217,0.7)' }}>
                                            {c.total_orders}
                                        </td>
                                        {/* Spent */}
                                        <td className="px-4 py-3 tabular-nums" style={{ color: '#D4AF37' }}>
                                            {formatPrice(c.total_spent)}
                                        </td>
                                        {/* Last order */}
                                        <td className="px-4 py-3 tabular-nums text-xs" style={{ color: 'rgba(235,229,217,0.4)' }}>
                                            {c.last_order_at
                                                ? new Date(c.last_order_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
                                                : '—'
                                            }
                                        </td>
                                        {/* Segment */}
                                        <td className="px-4 py-3">
                                            <SegmentBadge segment={c.segment} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ─────────────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
                        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37' }}
                    >◀ السابق</button>
                    <span className="text-xs tabular-nums" style={{ color: 'rgba(235,229,217,0.4)' }}>
                        {page} / {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-30"
                        style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', color: '#D4AF37' }}
                    >التالي ▶</button>
                </div>
            )}
        </div>
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, segment }: { name: string; segment: CustomerSegment }) {
    const initials = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('');
    const color = SEGMENT_COLOR[segment];
    return (
        <div
            className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-semibold"
            style={{
                width:      32, height: 32,
                background: SEGMENT_BG[segment],
                border:     `1px solid ${color}44`,
                color,
            }}
        >
            {initials}
        </div>
    );
}

export function SegmentBadge({ segment }: { segment: CustomerSegment }) {
    return (
        <span
            className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full"
            style={{
                background: SEGMENT_BG[segment],
                color:      SEGMENT_COLOR[segment],
                border:     `1px solid ${SEGMENT_COLOR[segment]}33`,
            }}
        >
            {segment === 'vip' && '★ '}{SEGMENT_LABEL[segment]}
        </span>
    );
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function IconUsers() {
    return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconStar() {
    return <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
}
function IconCheck() {
    return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconClock() {
    return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
