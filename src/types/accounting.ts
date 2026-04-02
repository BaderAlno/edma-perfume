export interface CostInputs {
    oil: number;
    alcohol: number;
    glass: number;
    otherRaw: number;
    monthlyRent: number;
    unitsPerMonth: number;
    packaging: number;
    shipping: number;
    localDelivery: number;
    customs: number;
    sellingPrice: number;
    unitsSold: number;
}

export interface AccountingResult {
    rawTotal: number;
    opsPerUnit: number;
    shippingTotal: number;
    totalCostPerUnit: number;
    totalRevenue: number;
    netProfit: number;
    marginPercent: number;
    topCostItem: string;
}

export interface ProductPreset extends CostInputs {
    name: string;
}
