import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
    try {
        const { question } = await req.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY missing' }), { status: 500 });
        }

        // 1. Fetch Summary Data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString());

        const totalRevenue = orders?.reduce((acc, o) => acc + Number(o.total_amount), 0) || 0;
        const totalOrders = orders?.length || 0;

        const summaryContext = {
            period: "Last 30 Days",
            business: "EDMA Perfume (Kuwait/KSA)",
            totalRevenue,
            totalOrders,
            currency: "SAR"
        };

        // 2. Claude API Streaming
        const stream = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 1000,
            system: `You are an intelligent business assistant for EDMA. You analyze the following context and answer questions in Arabic clearly and concisely. Context: ${JSON.stringify(summaryContext)}`,
            messages: [{ role: "user", content: question }],
            stream: true,
        });

        // Convert the Anthropic stream to a ReadableStream
        const readableStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        controller.enqueue(new TextEncoder().encode(chunk.delta.text));
                    }
                }
                controller.close();
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
