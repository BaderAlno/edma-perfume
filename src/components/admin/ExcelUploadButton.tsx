'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { bulkInsertProducts } from '@/lib/actions/products';
import type { CreateProductInput } from '@/lib/actions/products';

export default function ExcelUploadButton({ onSuccess }: { onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Expected columns: Name EN, Name AR, Price, Stock, Details EN, Details AR, Quote EN, Quote AR, Image URL
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            const productsToInsert: CreateProductInput[] = jsonData.map(row => ({
                name: String(row['Name EN'] || row['Name'] || 'New Product'),
                name_ar: String(row['Name AR'] || row['اسم المنتج'] || 'منتج جديد'),
                price_sar: Number(row['Price'] || row['السعر'] || 0),
                stock_quantity: Number(row['Stock'] || row['الكمية'] || 0),
                low_stock_threshold: Number(row['Low Stock'] || 10),
                description_en: [row['Details EN'] || row['Description'], row['Quote EN'] || row['Quote']].filter(Boolean).join('\n\nQuote: ') || null,
                description_ar: [row['Details AR'] || row['الوصف'], row['Quote AR'] || row['الاقتباس']].filter(Boolean).join('\n\nاقتباس: ') || null,
                image_url: row['Image URL'] || row['Image'] || row['صورة'] || null,
                is_active: true
            }));

            if (productsToInsert.length === 0) {
                alert('No valid rows found in Excel file.');
                return;
            }

            await bulkInsertProducts(productsToInsert);
            alert(`Successfully uploaded ${productsToInsert.length} products!`);
            onSuccess();
        } catch (error: any) {
            console.error('Error uploading excel:', error);
            alert('Error parsing Excel: ' + error.message);
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <input
                type="file"
                accept=".xlsx, .xls, .csv"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-xs px-4 py-2.5 rounded-lg transition-colors border border-[rgba(212,175,55,0.3)] hover:bg-[rgba(212,175,55,0.05)] flex items-center gap-2"
                style={{
                    color: '#D4AF37',
                    fontWeight: 500,
                }}
            >
                {loading ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin" style={{ animationDuration: '0.8s' }}>
                        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2" />
                        <path d="M12 2 a10 10 0 0 1 10 10" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                )}
                <span>{loading ? 'جاري الرفع...' : 'رفع Excel'}</span>
            </button>
        </>
    );
}
