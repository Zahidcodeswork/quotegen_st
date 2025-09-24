import React, { useMemo, useState } from 'react';
import Dashboard from './Dashboard';
import QuoteForm from './QuoteForm';
import QuotePreviewModal from './QuotePreviewModal';
import Toast from './Toast';
import { QuotesProvider, useQuotesContext } from '../app/quoteContext';
import { SavedQuote } from '../app/types';
import { generateQuotePDF } from '../app/pdf';

const AppContent = () => {
    const { state, voidQuote, persistQuote } = useQuotesContext();
    const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
    const [previewQuote, setPreviewQuote] = useState<SavedQuote | null>(null);
    const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);

    const sortedQuotes = useMemo(() => {
        return [...state.quotes].sort((a, b) => (a.date < b.date ? 1 : -1));
    }, [state.quotes]);

    const handleCreateNew = () => {
        setPreviewQuote(null);
        setView('form');
    };

    const handleQuoteGenerated = (quote: SavedQuote) => {
        const draft = persistQuote({ ...quote, status: 'Draft' }, 'Draft');
        setToast({ message: `Draft ${draft.quoteNo} created. Save or export when ready.`, tone: 'info' });
        setPreviewQuote(draft);
        setView('dashboard');
    };

    const handleValidationError = (messages: string[]) => {
        setToast({
            message: messages[0] || 'Please review the highlighted fields before continuing.',
            tone: 'error',
        });
    };

    const handleFinalizeQuote = (quote: SavedQuote, toastMessage?: string) => {
        const next = persistQuote({ ...quote, status: 'Active' }, 'Active');
        setPreviewQuote(next);
        if (toastMessage) {
            setToast({ message: toastMessage, tone: 'success' });
        }
        return next;
    };

    const handleDownloadPdf = async (quote: SavedQuote) => {
        const finalized = handleFinalizeQuote(quote);
        await generateQuotePDF(finalized);
        setToast({ message: `Quote ${finalized.quoteNo} saved and PDF generated.`, tone: 'success' });
    };

    const handleSaveQuote = (quote: SavedQuote) => {
        handleFinalizeQuote(quote, `Quote ${quote.quoteNo} marked Active.`);
    };

    const handlePreviewExisting = (quote: SavedQuote) => {
        setPreviewQuote(quote);
    };

    const handleClosePreview = () => {
        setPreviewQuote(null);
    };

    const handleVoid = (quote: SavedQuote) => {
        const reason = window.prompt('Please provide a reason for voiding this quote:');
        if (!reason) return;
        const trimmed = reason.trim();
        if (!trimmed) return;
        voidQuote(quote.quoteNo, trimmed);
        setToast({ message: `Quote ${quote.quoteNo} voided.`, tone: 'info' });
        setPreviewQuote(prev => prev && prev.quoteNo === quote.quoteNo ? { ...prev, status: 'Voided', voidReason: trimmed } : prev);
    };

    return (
        <>
            {view === 'dashboard' ? (
                <Dashboard
                    quotes={sortedQuotes}
                    onCreateNew={handleCreateNew}
                    onPreview={handlePreviewExisting}
                    onVoid={handleVoid}
                />
            ) : (
                <QuoteForm
                    onBackToDashboard={() => setView('dashboard')}
                    onQuoteCreated={handleQuoteGenerated}
                    onValidationError={handleValidationError}
                />
            )}
            {previewQuote && (
                <QuotePreviewModal
                    quote={previewQuote}
                    isDraft={previewQuote.status === 'Draft'}
                    onClose={handleClosePreview}
                    onSave={handleSaveQuote}
                    onDownloadPdf={handleDownloadPdf}
                    onVoid={handleVoid}
                />
            )}
            {toast && (
                <Toast
                    message={toast.message}
                    tone={toast.tone}
                    onDismiss={() => setToast(null)}
                />
            )}
        </>
    );
};

const App = () => (
    <QuotesProvider>
        <AppContent />
    </QuotesProvider>
);

export default App;
