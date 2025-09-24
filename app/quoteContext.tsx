import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { enrichItemsAndTotals, computeProcessedItems, computeTotals } from './calculations';
import { loadFromStorage, saveToStorage } from './storage';
import {
    QuoteDraftState,
    QuoteFormData,
    QuoteItemInput,
    SavedQuote,
    QuoteStatus,
} from './types';
import { createInitialFormData, createInitialItem, normalizeItems } from './factories';

interface QuoteState {
    quoteCounter: number;
    quotes: SavedQuote[];
}

const STORAGE_KEY_QUOTES = 'voxarelQuotes';
const STORAGE_KEY_COUNTER = 'voxarelQuoteCounter';

const initialState: QuoteState = {
    quoteCounter: 1,
    quotes: [],
};

type QuoteAction =
    | { type: 'hydrate'; payload: QuoteState }
    | { type: 'incrementCounter' }
    | { type: 'setQuotes'; payload: SavedQuote[] };

const quoteReducer = (state: QuoteState, action: QuoteAction): QuoteState => {
    switch (action.type) {
        case 'hydrate':
            return { ...state, ...action.payload };
        case 'incrementCounter':
            return { ...state, quoteCounter: state.quoteCounter + 1 };
        case 'setQuotes':
            return { ...state, quotes: action.payload };
        default:
            return state;
    }
};

export const createQuoteFromDraft = (
    draft: QuoteDraftState,
    status: QuoteStatus = 'Active'
): SavedQuote => {
    const { items, totals } = enrichItemsAndTotals(draft.items, draft.form);

    return {
        quoteNo: draft.form.quoteNo,
        date: draft.form.date,
        validUntil: draft.form.validUntil,
        formData: draft.form,
        items,
        totals,
        status,
    };
};

const migrateQuotes = (quotes: any[]): SavedQuote[] => {
    if (!Array.isArray(quotes)) return [];

    return quotes.map((quote, index) => {
        const baseForm = createInitialFormData();
        const formData: QuoteFormData = {
            ...baseForm,
            ...(quote.formData || {}),
            inclusions: Array.isArray(quote?.formData?.inclusions) ? quote.formData.inclusions : [],
            notes: quote?.formData?.notes ?? '',
        };

        const rawItems = Array.isArray(quote.items) ? quote.items : [];
        const normalizedItems = normalizeItems(
            rawItems.map((item: any, itemIndex: number) => ({
                ...createInitialItem(itemIndex, item?.ratePerKg ?? 0),
                ...item,
                itemNumber: item?.itemNumber ?? `Item ${itemIndex + 1}`,
                isSelected: item?.isSelected ?? true,
            }))
        );

        const processedItems = computeProcessedItems(normalizedItems);
        const totals = computeTotals(processedItems);

        return {
            quoteNo: quote.quoteNo ?? `Q-DXB-${String(index + 1).padStart(5, '0')}`,
            date: quote.date ?? formData.date,
            validUntil: quote.validUntil ?? formData.validUntil,
            formData,
            items: processedItems,
            totals,
            status: quote.status ?? 'Active',
            voidReason: quote.voidReason,
            approvalRequired: quote.approvalRequired,
            approvalStatus: quote.approvalStatus,
            modifiedBy: quote.modifiedBy,
            originalQuoteData: quote.originalQuoteData,
        };
    });
};

interface QuotesContextValue {
    state: QuoteState;
    generateQuoteNumber: () => string;
    persistQuote: (quote: SavedQuote, statusOverride?: QuoteStatus) => SavedQuote;
    updateQuoteStatus: (quoteNo: string, updates: Partial<SavedQuote>) => void;
    voidQuote: (quoteNo: string, reason: string) => void;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(quoteReducer, initialState);

    useEffect(() => {
        const storedQuotes = loadFromStorage<any[]>(STORAGE_KEY_QUOTES, []);
        const migratedQuotes = migrateQuotes(storedQuotes);
        const storedCounter = loadFromStorage<number>(STORAGE_KEY_COUNTER, 1);
        const highestCounter = migratedQuotes.reduce((max, quote) => {
            const match = quote.quoteNo.match(/(\d+)$/);
            if (!match) return max;
            const numeric = parseInt(match[1], 10);
            return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
        }, 0);
        const nextCounter = Math.max(storedCounter, highestCounter + 1, 1);
        dispatch({ type: 'hydrate', payload: { quoteCounter: nextCounter, quotes: migratedQuotes } });
    }, []);

    useEffect(() => {
        saveToStorage(STORAGE_KEY_QUOTES, state.quotes);
    }, [state.quotes]);

    useEffect(() => {
        saveToStorage(STORAGE_KEY_COUNTER, state.quoteCounter);
    }, [state.quoteCounter]);

    const generateQuoteNumber = () => {
        const number = state.quoteCounter;
        dispatch({ type: 'incrementCounter' });
        return `Q-DXB-${String(number).padStart(5, '0')}`;
    };

    const overwriteQuotes = (quotes: SavedQuote[]) => {
        dispatch({ type: 'setQuotes', payload: quotes });
    };

    const persistQuote = (quote: SavedQuote, statusOverride?: QuoteStatus) => {
        const nextQuote: SavedQuote = statusOverride
            ? { ...quote, status: statusOverride }
            : quote;

        const remaining = state.quotes.filter(existing => existing.quoteNo !== nextQuote.quoteNo);
        overwriteQuotes([nextQuote, ...remaining]);
        return nextQuote;
    };

    const updateQuoteStatus = (quoteNo: string, updates: Partial<SavedQuote>) => {
        overwriteQuotes(
            state.quotes.map(quote => (quote.quoteNo === quoteNo ? { ...quote, ...updates } : quote))
        );
    };

    const voidQuote = (quoteNo: string, reason: string) => {
        updateQuoteStatus(quoteNo, { status: 'Voided', voidReason: reason });
    };

    const value = useMemo<QuotesContextValue>(
        () => ({ state, generateQuoteNumber, persistQuote, updateQuoteStatus, voidQuote }),
        [state]
    );

    return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>;
};

export const useQuotesContext = () => {
    const ctx = useContext(QuotesContext);
    if (!ctx) throw new Error('useQuotesContext must be used within QuotesProvider');
    return ctx;
};

export const buildDraftState = (
    form: QuoteFormData,
    items: QuoteItemInput[]
): QuoteDraftState => ({ form, items });

export const rehydrateDraftTotals = (
    items: QuoteItemInput[],
    form: QuoteFormData
) => {
    const processed = computeProcessedItems(items);
    return { processed, totals: computeTotals(processed) };
};
