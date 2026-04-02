import type { CostInputs, AccountingResult } from "@/types/accounting";

/**
 * Pure function to calculate all accounting metrics for a given product configuration.
 */
export function calculateAccounting(inputs: CostInputs): AccountingResult {
    const {
        oil, alcohol, glass, otherRaw,
        monthlyRent, unitsPerMonth, packaging,
        shipping, localDelivery, customs,
        sellingPrice, unitsSold
    } = inputs;

    // 1. Raw materials total (per unit)
    const rawTotal = oil + alcohol + glass + otherRaw;

    // 2. Operations cost per unit
    const unitsVal = Math.max(1, unitsPerMonth);
    const rentPerUnit = monthlyRent / unitsVal;
    const opsPerUnit = rentPerUnit + packaging;

    // 3. Shipping & Delivery total (per unit)
    const shippingTotal = shipping + localDelivery + customs;

    // 4. Total cost per unit
    const totalCostPerUnit = rawTotal + opsPerUnit + shippingTotal;

    // 5. Total revenue
    const totalRevenue = sellingPrice * unitsSold;

    // 6. Net Profit
    const netProfit = totalRevenue - (totalCostPerUnit * unitsSold);

    // 7. Margin Percent
    const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 8. Identify the single highest cost item
    const costMap: Record<string, number> = {
        "زيت عطري": oil,
        "كحول": alcohol,
        "زجاج": glass,
        "إيجار": rentPerUnit,
        "الشحن": shipping,
        "التوصيل": localDelivery,
    };

    let topCostItem = "لا توجد تكاليف";
    let maxCost = -1;

    Object.entries(costMap).forEach(([name, cost]) => {
        if (cost > maxCost) {
            maxCost = cost;
            topCostItem = name;
        }
    });

    return {
        rawTotal,
        opsPerUnit,
        shippingTotal,
        totalCostPerUnit,
        totalRevenue,
        netProfit,
        marginPercent,
        topCostItem
    };
}

/**
 * Generate dynamic insight lines based on inputs and calculations.
 */
export function getAiInsights(inputs: CostInputs, result: AccountingResult): string[] {
    const { sellingPrice } = inputs;
    const { marginPercent, totalCostPerUnit, topCostItem, opsPerUnit } = result;
    const rentPerUnit = inputs.monthlyRent / Math.max(1, inputs.unitsPerMonth);
    const insights: string[] = [];

    if (sellingPrice === 0) return ["أدخل سعر البيع للوحدة لبدء تحليل الربحية."];

    // Margin-based insights
    if (marginPercent < 0) {
        insights.push(`⚠ المنتج يعمل بخسارة حالياً. التكلفة الإجمالية للوحدة (${totalCostPerUnit.toFixed(3)} د.ك) تتجاوز سعر البيع.`);
    } else if (marginPercent < 20) {
        insights.push("هامش الربح منخفض (أقل من 20%). يُنصح بمراجعة سعر البيع أو البحث عن بدائل لتقليل تكاليف الخامات.");
    } else if (marginPercent > 50) {
        insights.push("✓ أداء ممتاز! هامش الربح يتجاوز الـ 50%، مما يشير إلى ربحية عالية جداً.");
    } else {
        insights.push("هامش الربح معقول حالياً. يمكن تحسينه من خلال تحسين عمليات الشحن أو خفض تكلفة المواد الخام.");
    }

    // Cost-specific insights
    insights.push(`بند الفاتورة الأكبر حالياً هو <span class="text-[#f0c040] font-semibold">${topCostItem}</span>. يُنصح بالتفاوض مع المورد أو تحسين الاستهلاك.`);

    if (rentPerUnit > totalCostPerUnit * 0.3) {
        insights.push("تكلفة الإيجار تمثل أكثر من 30% من تكلفة الوحدة. زيادة حجم الإنتاج الشهري سيقلل من وطأة الإيجار على الوحدة الواحدة.");
    }

    if (inputs.shipping > totalCostPerUnit * 0.25) {
        insights.push("تكاليف الشحن مرتفعة نسبياً. فكّر في تقديم عروض 'توصيل مجمّع' أو التعاون مع شركة توصيل محلية بعقود شهرية.");
    }

    return insights;
}
