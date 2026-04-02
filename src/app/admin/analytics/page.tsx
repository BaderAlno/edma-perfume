import { Suspense } from 'react';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';

// ── Fallback spinner ──────────────────────────────────────────────────────────

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <svg
                width={32}
                height={32}
                viewBox="0 0 24 24"
                className="animate-spin"
                style={{ animationDuration: '0.8s' }}
            >
                <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="2.5" />
                <path
                    d="M12 2 a10 10 0 0 1 10 10"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
//
// AnalyticsDashboard uses `useSearchParams`, which requires a Suspense
// boundary in the server component tree (Next.js App Router requirement).

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <AnalyticsDashboard />
        </Suspense>
    );
}
