import type { ProductWithStockStatus } from '@/lib/database.types';

interface Props {
    lowStockProducts: ProductWithStockStatus[];
    pendingCount:     number;
}

export default function AlertBanner({ lowStockProducts, pendingCount }: Props) {
    const hasAlerts = lowStockProducts.length > 0 || pendingCount > 0;
    if (!hasAlerts) return null;

    return (
        <div className="flex flex-col gap-2">
            {lowStockProducts.length > 0 && (
                <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                    style={{
                        background: 'rgba(255,107,107,0.08)',
                        border:     '1px solid rgba(255,107,107,0.2)',
                    }}
                >
                    <span style={{ color: '#ff6b6b', fontSize: 16 }}>⚠</span>
                    <span style={{ color: '#ff6b6b' }}>
                        {lowStockProducts.length === 1
                            ? `منتج واحد بمخزون منخفض: ${lowStockProducts[0].name}`
                            : `${lowStockProducts.length} منتجات بمخزون منخفض — `
                        }
                    </span>
                    {lowStockProducts.length > 1 && (
                        <span style={{ color: 'rgba(255,107,107,0.7)' }}>
                            {lowStockProducts.map(p => p.name).join('، ')}
                        </span>
                    )}
                    <a
                        href="/admin/inventory"
                        className="mr-auto text-xs underline underline-offset-2"
                        style={{ color: 'rgba(255,107,107,0.7)' }}
                    >
                        إدارة المخزون
                    </a>
                </div>
            )}

            {pendingCount > 0 && (
                <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                    style={{
                        background: 'rgba(251,191,36,0.07)',
                        border:     '1px solid rgba(251,191,36,0.18)',
                    }}
                >
                    <span style={{ color: '#fbbf24', fontSize: 16 }}>◷</span>
                    <span style={{ color: '#fbbf24' }}>
                        {pendingCount} طلب{pendingCount > 1 ? '' : ''} بانتظار المعالجة
                    </span>
                    <a
                        href="/admin/orders?status=pending"
                        className="mr-auto text-xs underline underline-offset-2"
                        style={{ color: 'rgba(251,191,36,0.6)' }}
                    >
                        عرض الطلبات
                    </a>
                </div>
            )}
        </div>
    );
}
