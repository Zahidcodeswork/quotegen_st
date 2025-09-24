import {
    ProcessedQuoteItem,
    QuoteFormData,
    QuoteItemInput,
    QuoteTotals,
    ModeOfService,
} from './types';
import { VOLUMETRIC_WEIGHT_DIVISOR } from './constants';

export const calculateCBM = (length: number, breadth: number, height: number): number => {
    if (!length || !breadth || !height) return 0;
    return (length * breadth * height) / 1_000_000;
};

export const calculateVolumetricWeight = (length: number, breadth: number, height: number): number => {
    if (!length || !breadth || !height) return 0;
    return (length * breadth * height) / VOLUMETRIC_WEIGHT_DIVISOR;
};

export const calculateBilledWeight = (actual: number, volumetric: number): number => {
    if (!actual && !volumetric) return 0;
    return Math.max(actual, volumetric);
};

export const computeProcessedItem = (item: QuoteItemInput): ProcessedQuoteItem => {
    const cbm = calculateCBM(item.length, item.breadth, item.height);
    const volumetricWeight = calculateVolumetricWeight(item.length, item.breadth, item.height);
    const billedWeight = calculateBilledWeight(item.actualWeight, volumetricWeight);
    const unitCost = (billedWeight * item.ratePerKg) + item.packingCharge + item.handlingCharge + item.duty;
    const lineTotal = unitCost * item.quantity;

    return {
        ...item,
        cbm,
        volumetricWeight,
        billedWeight,
        unitCost,
        lineTotal,
        requiresPhoto: item.category === 'Irregular/Furniture',
    };
};

export const computeProcessedItems = (items: QuoteItemInput[]): ProcessedQuoteItem[] => (
    items.map(item => computeProcessedItem(item))
);

export const computeTotals = (items: ProcessedQuoteItem[]): QuoteTotals => {
    const selectedItems = items.filter(item => item.isSelected);

    const subtotal = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const grandTotal = subtotal;
    const totalCBM = selectedItems.reduce((sum, item) => sum + item.cbm * item.quantity, 0);
    const totalBilledWeight = selectedItems.reduce((sum, item) => sum + item.billedWeight * item.quantity, 0);

    return {
        subtotal,
        grandTotal,
        totalCBM,
        totalBilledWeight,
        selectedCount: selectedItems.length,
    };
};

export const getTransitTime = (service: ModeOfService | ''): string => {
    if (service === 'Air Freight') return '10-15 Working Days';
    if (service === 'Sea Freight') return '40-45 Working Days';
    return '';
};

export const formatCurrency = (value: number): string => {
    return `AED ${value.toFixed(2)}`;
};

export const enrichItemsAndTotals = (
    items: QuoteItemInput[],
    formData: QuoteFormData
): { items: ProcessedQuoteItem[]; totals: QuoteTotals } => {
    const processed = computeProcessedItems(items);
    const totals = computeTotals(processed);
    return { items: processed, totals };
};
