import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { enrichItemsAndTotals, computeProcessedItems, computeTotals } from './calculations';
import { createInitialFormData, createInitialItem, normalizeItems } from './factories';
import { useAuth } from './authContext';
import { supabase } from './supabaseClient';
import {
    QuoteDraftState,
    QuoteFormData,
    QuoteItemInput,
    SavedQuote,
    QuoteStatus,
} from './types';

interface QuoteState {
    quoteCounter: number;
    quotes: SavedQuote[];
}

interface QuoteRow {
    id: string;
    quote_no: string;
    user_id: string;
    status: QuoteStatus;
    owner_email?: string | null;
    payload: SavedQuote;
    created_at?: string;
    updated_at?: string;
}

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

const mapRowToQuote = (row: QuoteRow): SavedQuote => {
    const payload = row.payload ?? {} as SavedQuote;
    return {
        ...payload,
        quoteNo: payload.quoteNo ?? row.quote_no,
        status: payload.status ?? row.status ?? 'Draft',
        id: row.id,
        userId: row.user_id,
        ownerEmail: row.owner_email ?? payload.ownerEmail ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

const deriveNextCounter = (quotes: SavedQuote[]): number => {
    const highestCounter = quotes.reduce((max, quote) => {
        const match = quote.quoteNo.match(/(\d+)$/);
        if (!match) return max;
        const numeric = parseInt(match[1], 10);
        return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    return Math.max(highestCounter + 1, 1);
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
            id: quote.id,
            userId: quote.userId,
            ownerEmail: quote.ownerEmail,
            createdAt: quote.createdAt,
            updatedAt: quote.updatedAt,
        };
    });
};

interface QuotesContextValue {
    state: QuoteState;
    isLoading: boolean;
    error: string | null;
    generateQuoteNumber: () => string;
    persistQuote: (quote: SavedQuote, statusOverride?: QuoteStatus) => Promise<SavedQuote>;
    updateQuoteStatus: (quoteNo: string, updates: Partial<SavedQuote>) => Promise<SavedQuote | null>;
    voidQuote: (quoteNo: string, reason: string) => Promise<SavedQuote | null>;
    refreshQuotes: () => Promise<void>;
}

const QuotesContext = createContext<QuotesContextValue | undefined>(undefined);

export const QuotesProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, profile } = useAuth();
    const [state, dispatch] = useReducer(quoteReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const overwriteQuotes = useCallback((quotes: SavedQuote[]) => {
        dispatch({ type: 'setQuotes', payload: quotes });
    }, []);

    const fetchQuotes = useCallback(async () => {
        if (!user) {
            dispatch({ type: 'hydrate', payload: { quoteCounter: 1, quotes: [] } });
            setError(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const isAdmin = profile?.role === 'admin';
            let query = supabase
                .from('quotes')
                .select('id, quote_no, user_id, status, owner_email, payload, created_at, updated_at')
                .order('created_at', { ascending: false });

            if (!isAdmin) {
                query = query.eq('user_id', user.id);
            }

            const { data, error: fetchError } = await query;
            if (fetchError) {
                throw fetchError;
            }

            const mapped = migrateQuotes((data ?? []).map(mapRowToQuote));
            const nextCounter = deriveNextCounter(mapped);
            dispatch({ type: 'hydrate', payload: { quoteCounter: nextCounter, quotes: mapped } });
            setIsLoading(false);
        } catch (fetchErr: any) {
            console.error('Failed to load quotes', fetchErr);
            setError(fetchErr.message ?? 'Failed to load quotes');
            overwriteQuotes([]);
            setIsLoading(false);
        }
    }, [overwriteQuotes, profile?.role, user]);

    useEffect(() => {
        void fetchQuotes();
    }, [fetchQuotes]);

    const generateQuoteNumber = useCallback(() => {
        const number = state.quoteCounter;
        dispatch({ type: 'incrementCounter' });
        return `Q-DXB-${String(number).padStart(5, '0')}`;
    }, [state.quoteCounter]);

    const persistQuote = useCallback(async (quote: SavedQuote, statusOverride?: QuoteStatus) => {
        if (!user) {
            throw new Error('Cannot persist quote without an authenticated user.');
        }

        const nextQuote: SavedQuote = statusOverride
            ? { ...quote, status: statusOverride }
            : quote;

        try {
            const { data, error: upsertError } = await supabase
                .from('quotes')
                .upsert({
                    quote_no: nextQuote.quoteNo,
                    user_id: user.id,
                    status: nextQuote.status,
                    owner_email: user.email ?? null,
                    payload: nextQuote,
                }, {
                    onConflict: 'quote_no',
                })
                .select('id, quote_no, user_id, status, owner_email, payload, created_at, updated_at')
                .single();

            if (upsertError) {
                throw upsertError;
            }

            const saved = migrateQuotes([mapRowToQuote(data)])[0];
            const remaining = state.quotes.filter(existing => existing.quoteNo !== saved.quoteNo);
            overwriteQuotes([saved, ...remaining]);
            setError(null);
            return saved;
        } catch (persistError: any) {
            console.error('Failed to persist quote', persistError);
            setError(persistError.message ?? 'Failed to persist quote');
            throw persistError;
        }
    }, [overwriteQuotes, state.quotes, user]);

    const updateQuoteStatus = useCallback(async (quoteNo: string, updates: Partial<SavedQuote>) => {
        const existing = state.quotes.find(quote => quote.quoteNo === quoteNo);
        if (!existing) {
            return null;
        }

        const merged: SavedQuote = {
            ...existing,
            ...updates,
            formData: updates.formData ?? existing.formData,
            items: updates.items ?? existing.items,
            totals: updates.totals ?? existing.totals,
        };

        try {
            const { data, error: updateError } = await supabase
                .from('quotes')
                .update({
                    status: merged.status,
                    owner_email: merged.ownerEmail ?? existing.ownerEmail ?? null,
                    payload: merged,
                })
                .eq('quote_no', quoteNo)
                .select('id, quote_no, user_id, status, owner_email, payload, created_at, updated_at')
                .single();

            if (updateError) {
                throw updateError;
            }

            const saved = migrateQuotes([mapRowToQuote(data)])[0];
            const remaining = state.quotes.filter(quote => quote.quoteNo !== saved.quoteNo);
            overwriteQuotes([saved, ...remaining]);
            setError(null);
            return saved;
        } catch (updateErr: any) {
            console.error('Failed to update quote', updateErr);
            setError(updateErr.message ?? 'Failed to update quote');
            throw updateErr;
        }
    }, [overwriteQuotes, state.quotes]);

    const voidQuote = useCallback(async (quoteNo: string, reason: string) => {
        return updateQuoteStatus(quoteNo, { status: 'Voided', voidReason: reason });
    }, [updateQuoteStatus]);

    const value = useMemo<QuotesContextValue>(() => ({
        state,
        isLoading,
        error,
        generateQuoteNumber,
        persistQuote,
        updateQuoteStatus,
        voidQuote,
        refreshQuotes: fetchQuotes,
    }), [error, fetchQuotes, generateQuoteNumber, isLoading, persistQuote, state, updateQuoteStatus, voidQuote]);

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
