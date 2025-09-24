import { useCallback, useMemo, useState } from 'react';
import { createInitialFormData, createInitialItem, normalizeItems } from './factories';
import { enrichItemsAndTotals, getTransitTime } from './calculations';
import { buildDraftState, createQuoteFromDraft, useQuotesContext } from './quoteContext';
import { validateForm, validateItems } from './validation';
import { ProcessedQuoteItem, QuoteFormData, QuoteItemInput, QuoteValidationError, SavedQuote } from './types';

interface QuoteFormHook {
    step: number;
    form: QuoteFormData;
    items: QuoteItemInput[];
    processedItems: ProcessedQuoteItem[];
    totals: ReturnType<typeof enrichItemsAndTotals>['totals'];
    errors: Record<string, string>;
    goToStep: (step: number) => void;
    updateField: (field: keyof QuoteFormData, value: string) => void;
    toggleInclusion: (option: string, checked: boolean) => void;
    updateItem: (id: number, field: keyof QuoteItemInput, value: any) => void;
    addItem: () => void;
    removeItem: (id: number) => void;
    toggleItemSelection: (id: number, checked: boolean) => void;
    generateQuote: () => { success: boolean; errors?: QuoteValidationError[]; quote?: SavedQuote };
    saveDraft: () => Promise<SavedQuote | null>;
    reset: (keepDashboard?: boolean) => void;
}

export const useQuoteForm = (): QuoteFormHook => {
    const { generateQuoteNumber, persistQuote } = useQuotesContext();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<QuoteFormData>(() => {
        const initial = createInitialFormData();
        initial.quoteNo = generateQuoteNumber();
        return initial;
    });
    const [items, setItems] = useState<QuoteItemInput[]>([createInitialItem()]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { items: processedItems, totals } = useMemo(() => enrichItemsAndTotals(items, form), [items, form]);

    const goToStep = (value: number) => setStep(value);

    const updateField = (field: keyof QuoteFormData, value: string) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'modeOfService') {
                updated.transitTime = getTransitTime(value);
            }
            return updated;
        });
    };

    const toggleInclusion = (option: string, checked: boolean) => {
        setForm(prev => ({
            ...prev,
            inclusions: checked
                ? Array.from(new Set([...prev.inclusions, option]))
                : prev.inclusions.filter(item => item !== option),
        }));
    };

    const updateItem = (id: number, field: keyof QuoteItemInput, value: any) => {
        setItems(prev => normalizeItems(prev.map(item => (item.id === id ? { ...item, [field]: value } : item))));
    };

    const addItem = () => {
        setItems(prev => {
            const rateSeed = prev.length > 0 ? prev[prev.length - 1].ratePerKg : 0;
            const next = normalizeItems([...prev, createInitialItem(prev.length, rateSeed)]);
            return next;
        });
    };

    const removeItem = (id: number) => {
        setItems(prev => {
            const filtered = prev.filter(item => item.id !== id);
            return filtered.length ? normalizeItems(filtered) : [createInitialItem()];
        });
    };

    const toggleItemSelection = (id: number, checked: boolean) => {
        setItems(prev => prev.map(item => (item.id === id ? { ...item, isSelected: checked } : item)));
    };

    const mapErrors = (validationErrors: QuoteValidationError[]) => {
        const nextErrors: Record<string, string> = {};
        validationErrors.forEach(error => {
            nextErrors[error.field] = error.message;
        });
        setErrors(nextErrors);
    };

    const clearErrors = () => setErrors({});

    const generateQuote = () => {
        const formErrors = validateForm(form);
        const itemErrors = validateItems(items);
        const allErrors = [...formErrors, ...itemErrors];

        if (allErrors.length > 0) {
            mapErrors(allErrors);
            return { success: false, errors: allErrors as QuoteValidationError[] };
        }

        clearErrors();
        const draft = buildDraftState(form, items);
        const quote = createQuoteFromDraft(draft, 'Draft');
        return { success: true, quote };
    };

    const saveDraft = useCallback(async (): Promise<SavedQuote | null> => {
        if (!form.quoteNo) return null;
        const draftState = buildDraftState(form, items);
        const draftQuote = createQuoteFromDraft(draftState, 'Draft');
        try {
            return await persistQuote(draftQuote, 'Draft');
        } catch (error) {
            console.error('Failed to save draft', error);
            return null;
        }
    }, [form, items, persistQuote]);

    const reset = (keepDashboard = false) => {
        setForm(() => {
            const initial = createInitialFormData();
            initial.quoteNo = generateQuoteNumber();
            return initial;
        });
        setItems([createInitialItem()]);
        clearErrors();
        if (!keepDashboard) setStep(1);
    };

    return {
        step,
        form,
        items,
        processedItems,
        totals,
        errors,
        goToStep,
        updateField,
        toggleInclusion,
        updateItem,
        addItem,
        removeItem,
        toggleItemSelection,
        generateQuote,
        saveDraft,
        reset,
    };
};
