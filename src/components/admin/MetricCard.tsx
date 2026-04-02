import { useCurrency } from '@/context/CurrencyContext';

interface MetricCardProps {
    label:           string;
    value:           string | number;
    change?:         number;       // percentage, e.g. 12.5 or -8.3
    changeDirection?: 'up' | 'down' | 'neutral';
    suffix?:         string;       // e.g. 'ر.س'
    icon?:           React.ReactNode;
    isCurrency?:     boolean;
}

export default function MetricCard({
    label,
    value,
    change,
    changeDirection = 'neutral',
    suffix,
    icon,
    isCurrency = false,
}: MetricCardProps) {
    const { formatPrice } = useCurrency();
    const hasChange = change !== undefined && changeDirection !== 'neutral';

    const changeColor =
        changeDirection === 'up'   ? '#4ade80' :
        changeDirection === 'down' ? '#ff6b6b' :
        'rgba(235,229,217,0.4)';

    const changeIcon =
        changeDirection === 'up'   ? '↑' :
        changeDirection === 'down' ? '↓' : '–';

    const displayValue = isCurrency && typeof value === 'number' 
        ? formatPrice(value) 
        : typeof value === 'number' ? value.toLocaleString('ar-SA') : value;

    return (
        <div
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{
                background: '#120e08',
                border:     '1px solid rgba(212,175,55,0.1)',
            }}
        >
            {/* Top row */}
            <div className="flex items-center justify-between">
                <span
                    className="text-xs tracking-widest uppercase"
                    style={{ color: 'rgba(212,175,55,0.55)' }}
                >
                    {label}
                </span>
                {icon && (
                    <span style={{ color: 'rgba(212,175,55,0.35)' }}>
                        {icon}
                    </span>
                )}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-1.5">
                <span
                    className="text-2xl font-light tabular-nums"
                    style={{ color: '#D4AF37' }}
                >
                    {displayValue}
                </span>
                {!isCurrency && suffix && (
                    <span className="text-sm" style={{ color: 'rgba(212,175,55,0.5)' }}>
                        {suffix}
                    </span>
                )}
            </div>

            {/* Change badge */}
            {hasChange && (
                <div className="flex items-center gap-1.5">
                    <span
                        className="text-xs font-medium tabular-nums"
                        style={{ color: changeColor }}
                    >
                        {changeIcon} {Math.abs(change!).toFixed(1)}%
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(235,229,217,0.3)' }}>
                        مقارنة بالشهر الماضي
                    </span>
                </div>
            )}
        </div>
    );
}
