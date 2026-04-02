'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type DatePreset = '7d' | '30d' | '3m' | 'year';

export interface DateRange {
    start:     Date;
    end:       Date;
    prevStart: Date;
    prevEnd:   Date;
}

// ── Date range computation (exported so the page can reuse) ───────────────────

export function computePresetRange(preset: DatePreset): DateRange {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let start:     Date;
    let prevStart: Date;
    let prevEnd:   Date;

    switch (preset) {
        case '7d': {
            start = new Date(end);
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - 6);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case '30d': {
            start = new Date(end);
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setDate(prevStart.getDate() - 29);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case '3m': {
            start = new Date(end);
            start.setMonth(start.getMonth() - 3);
            start.setHours(0, 0, 0, 0);
            prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd);
            prevStart.setMonth(prevStart.getMonth() - 3);
            prevStart.setHours(0, 0, 0, 0);
            break;
        }
        case 'year':
        default: {
            start     = new Date(end.getFullYear(), 0, 1);
            prevEnd   = new Date(start.getTime() - 1);
            prevEnd.setHours(23, 59, 59, 999);
            prevStart = new Date(prevEnd.getFullYear(), 0, 1);
            break;
        }
    }

    return { start, end, prevStart, prevEnd };
}

export function computeCustomRange(from: string, to: string): DateRange {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const diffMs  = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd.getTime() - diffMs);
    prevStart.setHours(0, 0, 0, 0);

    return { start, end, prevStart, prevEnd };
}

// ── Presets config ────────────────────────────────────────────────────────────

const PRESETS: { key: DatePreset; label: string }[] = [
    { key: '7d',   label: 'آخر 7 أيام' },
    { key: '30d',  label: 'آخر 30 يوم' },
    { key: '3m',   label: 'آخر 3 أشهر' },
    { key: 'year', label: 'هذا العام'   },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    activePreset: DatePreset | null;
    fromValue:    string;   // YYYY-MM-DD for the custom input
    toValue:      string;
}

export default function DateRangePicker({ activePreset, fromValue, toValue }: Props) {
    const router       = useRouter();
    const pathname     = usePathname();
    const searchParams = useSearchParams();

    const push = useCallback(
        (updater: (p: URLSearchParams) => void) => {
            const p = new URLSearchParams(searchParams.toString());
            updater(p);
            router.push(`${pathname}?${p.toString()}`);
        },
        [router, pathname, searchParams],
    );

    function selectPreset(preset: DatePreset) {
        push(p => {
            p.set('preset', preset);
            p.delete('from');
            p.delete('to');
        });
    }

    function applyCustom(from: string, to: string) {
        if (!from || !to || from > to) return;
        push(p => {
            p.delete('preset');
            p.set('from', from);
            p.set('to', to);
        });
    }

    const activeStyle = {
        background: 'rgba(201,168,76,0.15)',
        border:     '1px solid rgba(201,168,76,0.4)',
        color:      '#C9A84C',
    } as const;

    const inactiveStyle = {
        background: 'rgba(255,255,255,0.04)',
        border:     '1px solid rgba(255,255,255,0.08)',
        color:      'rgba(235,229,217,0.55)',
    } as const;

    const inputStyle = {
        background:  'rgba(255,255,255,0.04)',
        border:      '1px solid rgba(255,255,255,0.08)',
        color:       'rgba(235,229,217,0.75)',
        borderRadius: 8,
        padding:     '5px 8px',
        fontSize:    12,
        outline:     'none',
        colorScheme: 'dark',
    } as const;

    return (
        <div className="flex items-center gap-2 flex-wrap" dir="rtl">
            {/* Preset buttons */}
            {PRESETS.map(({ key, label }) => (
                <button
                    key={key}
                    onClick={() => selectPreset(key)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 select-none"
                    style={activePreset === key ? activeStyle : inactiveStyle}
                >
                    {label}
                </button>
            ))}

            {/* Divider */}
            <span style={{ color: 'rgba(235,229,217,0.15)', marginInline: 4 }}>|</span>

            {/* Custom range inputs */}
            <input
                type="date"
                value={fromValue}
                max={toValue || undefined}
                onChange={e => applyCustom(e.target.value, toValue)}
                style={inputStyle}
            />
            <span style={{ color: 'rgba(235,229,217,0.3)', fontSize: 12 }}>—</span>
            <input
                type="date"
                value={toValue}
                min={fromValue || undefined}
                onChange={e => applyCustom(fromValue, e.target.value)}
                style={inputStyle}
            />
        </div>
    );
}
