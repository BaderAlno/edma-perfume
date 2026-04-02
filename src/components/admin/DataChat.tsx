"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
    'ما أفضل يوم للمبيعات؟',
    'من أكثر العملاء إنفاقاً؟',
    'أي عطر يحقق أعلى إيراد؟'
];

interface Message {
    role: "user" | "ai";
    content: string;
}

export default function DataChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSubmit = async (query: string) => {
        if (!query.trim() || isThinking) return;

        setInput("");
        setMessages(prev => [...prev, { role: "user", content: query }]);
        setIsThinking(true);
        setMessages(prev => [...prev, { role: "ai", content: "" }]);

        try {
            const res = await fetch("/api/chat-with-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: query })
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                setMessages(prev => {
                    const newArr = [...prev];
                    const last = newArr[newArr.length - 1];
                    last.content += chunk;
                    return newArr;
                });
            }
        } catch (err) {
            setMessages(prev => {
                const newArr = [...prev];
                const last = newArr[newArr.length - 1];
                last.content = "عذراً، حدث خطأ أثناء الاتصال بالخادم.";
                return newArr;
            });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <section className="mt-8 bg-[#0A0806] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col h-[600px]" dir="rtl">
            <h2 className="text-xl font-arabic font-semibold text-[#EBE5D9] mb-6 flex items-center gap-2">
                <span>💬</span> مساعد البيانات
            </h2>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                        <svg className="w-12 h-12 mb-4 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                        </svg>
                        <p className="font-arabic text-[#EBE5D9]">اسأل عن أي تفاصيل حول أداء متجرك...</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] rounded-2xl px-5 py-3 font-arabic leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#D4AF37] text-[#0A0806] rounded-br-sm'
                                        : 'bg-white/5 border border-white/10 text-[#EBE5D9] rounded-bl-sm'
                                    }`}>
                                    {msg.content || (msg.role === 'ai' && isThinking && "...")}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={endRef} />
            </div>

            {/* Suggested Chips */}
            {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {SUGGESTIONS.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSubmit(s)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#EBE5D9]/80 text-xs font-arabic px-3 py-1.5 rounded-full transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Form */}
            <form
                onSubmit={(e) => { e.preventDefault(); handleSubmit(input); }}
                className="relative flex items-center"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اسأل عن بياناتك..."
                    disabled={isThinking}
                    className="w-full bg-[#120D08] border border-white/10 focus:border-[#D4AF37]/50 rounded-xl px-4 py-3 pr-12 text-[#EBE5D9] font-arabic outline-none transition-colors disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className="absolute right-3 bg-[#D4AF37] hover:bg-[#B8960C] text-[#0A0806] rounded-lg w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </form>
        </section>
    );
}
