import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopBar from '@/components/admin/AdminTopBar';
import { CurrencyProvider } from '@/context/CurrencyContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <CurrencyProvider>
            <div
                dir="rtl"
                className="flex min-h-screen"
                style={{ background: '#0d0905', color: '#EBE5D9' }}
            >
                <AdminSidebar />
                <div className="flex-1 flex flex-col min-h-screen">
                    <AdminTopBar />
                    <main className="flex-1 overflow-auto p-8 pt-0">
                        {children}
                    </main>
                </div>
            </div>
        </CurrencyProvider>
    );
}
