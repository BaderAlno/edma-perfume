import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST() {
    try {
        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: 'ANTHROPIC_API_KEY is missing' }, { status: 500 });
        }

        // 1. Fetch Aggregated Data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateString = thirtyDaysAgo.toISOString();

        // Fetch Orders for revenue and customers
        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('id, total_amount, status, created_at, email')
            .gte('created_at', dateString);

        // Fetch low stock products
        const { data: stockLevels } = await supabaseAdmin
            .from('product_stock')
            .select('product_id, stock_quantity, low_stock_threshold')
            .lte('stock_quantity', 10);

        // Aggregate Data
        const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
        const totalOrders = orders?.length || 0;

        // Group by customer
        const customers: Record<string, number> = {};
        orders?.forEach(order => {
            if (order.email) {
                customers[order.email] = (customers[order.email] || 0) + Number(order.total_amount);
            }
        });

        const topCustomers = Object.entries(customers)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([email, spent]) => ({ email, spent }));

        const businessContext = {
            period: "Last 30 Days",
            totalRevenue,
            totalOrders,
            topCustomers,
            lowStockProductsCount: stockLevels?.length || 0
        };

        // 2. Claude API Call
        const prompt = `You are a business analyst for EDMA, a luxury Arabic perfume brand in Kuwait and KSA. 
Analyze the aggregated data and return a JSON array of exactly 4 insights. 
Each object must have: {type: 'trend'|'warning'|'opportunity'|'customer', title_ar: string, insight_ar: string, data_point: string, recommendation_ar: string, icon: string}.
Output ONLY the raw JSON array. Do NOT wrap it in markdown code blocks (no \`\`\`json).

Aggregated Data:
${JSON.stringify(businessContext, null, 2)}`;

        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1000,
            temperature: 0.7,
            system: "You are an expert luxury perfume business data analyst.",
            messages: [{ role: "user", content: prompt }]
        });

        const content = response.content[0].type === "text" ? response.content[0].text : "[]";

        // Clean markdown backticks if Claude still included them
        const cleanedContent = content.replace(/^```json/g, '').replace(/```$/g, '').trim();
        const insights = JSON.parse(cleanedContent);

        return NextResponse.json(insights);
    } catch (error: any) {
        console.error('AI Insights Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
