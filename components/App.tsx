import React, { useMemo, useState } from 'react';
import Dashboard from './Dashboard';
import QuoteForm from './QuoteForm';
import QuotePreviewModal from './QuotePreviewModal';
import Toast from './Toast';
import AuthScreen from './AuthScreen';
import AdminUsersPanel from './AdminUsersPanel';
import { QuotesProvider, useQuotesContext } from '../app/quoteContext';
import { SavedQuote } from '../app/types';
import { generateQuotePDF } from '../app/pdf';
import { AuthProvider, useAuth } from '../app/authContext';

const LoadingScreen = ({ message }: { message: string }) => (
    <div className="loading-screen">
        <div className="loading-card">
            <div className="spinner" aria-hidden="true" />
            <p>{message}</p>
        </div>
    </div>
);

const AuthenticatedApp = () => {
    const { state, voidQuote, persistQuote, isLoading: quotesLoading, error: quotesError, refreshQuotes } = useQuotesContext();
    const { signOut, profile, user } = useAuth();
    const [view, setView] = useState<'dashboard' | 'form' | 'users'>('dashboard');
    const [previewQuote, setPreviewQuote] = useState<SavedQuote | null>(null);
    const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);
    const [quoteActionPending, setQuoteActionPending] = useState(false);

    const sortedQuotes = useMemo(() => {
        return [...state.quotes].sort((a, b) => (a.date < b.date ? 1 : -1));
    }, [state.quotes]);

    const isAdmin = profile?.role === 'admin';

    const handleCreateNew = () => {
        if (quotesLoading) return;
        setPreviewQuote(null);
        setView('form');
    };

    const handleQuoteGenerated = async (quote: SavedQuote) => {
        setQuoteActionPending(true);
        try {
            const draft = await persistQuote({ ...quote, status: 'Draft' }, 'Draft');
            setToast({ message: `Draft ${draft.quoteNo} created. Save or export when ready.`, tone: 'info' });
            setPreviewQuote(draft);
            setView('dashboard');
        } catch (error: any) {
            setToast({ message: error?.message ?? 'Unable to save draft. Try again.', tone: 'error' });
        } finally {
            setQuoteActionPending(false);
        }
    };

    const handleFinalizeQuote = async (quote: SavedQuote, toastMessage?: string) => {
        setQuoteActionPending(true);
        try {
            const next = await persistQuote({ ...quote, status: 'Active' }, 'Active');
            if (toastMessage) {
                setToast({ message: toastMessage, tone: 'success' });
            }
            setPreviewQuote(next);
            return next;
        } catch (error: any) {
            setToast({ message: error?.message ?? 'Unable to update quote.', tone: 'error' });
            throw error;
        } finally {
            setQuoteActionPending(false);
        }
    };

    const handleDownloadPdf = async (quote: SavedQuote) => {
        try {
            const finalized = await handleFinalizeQuote(quote);
            await generateQuotePDF(finalized);
            setToast({ message: `Quote ${finalized.quoteNo} saved and PDF generated.`, tone: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to generate PDF. Please retry.', tone: 'error' });
        }
    };

    const handleSaveQuote = async (quote: SavedQuote) => {
        try {
            await handleFinalizeQuote(quote, `Quote ${quote.quoteNo} marked Active.`);
        } catch (error) {
            // Toast already handled in handleFinalizeQuote.
        }
    };

    const handlePreviewExisting = (quote: SavedQuote) => {
        setPreviewQuote(quote);
        setView('dashboard');
    };

    const handleClosePreview = () => {
        setPreviewQuote(null);
    };

    const handleVoid = async (quote: SavedQuote) => {
        const reason = window.prompt('Please provide a reason for voiding this quote:');
        if (!reason) return;
        const trimmed = reason.trim();
        if (!trimmed) return;
        try {
            const updated = await voidQuote(quote.quoteNo, trimmed);
            if (updated) {
                setPreviewQuote(prev => (prev && prev.quoteNo === updated.quoteNo ? updated : prev));
            }
            setToast({ message: `Quote ${quote.quoteNo} voided.`, tone: 'info' });
        } catch (error: any) {
            setToast({ message: error?.message ?? 'Unable to void quote.', tone: 'error' });
        }
    };

    const handleManageUsers = () => {
        setPreviewQuote(null);
        setView('users');
    };

    return (
        <>
            {view === 'dashboard' && (
                <Dashboard
                    quotes={sortedQuotes}
                    onCreateNew={handleCreateNew}
                    onPreview={handlePreviewExisting}
                    onVoid={handleVoid}
                    onSignOut={() => signOut()}
                    userEmail={user?.email ?? null}
                    loading={quotesLoading || quoteActionPending}
                    error={quotesError}
                    onRefresh={refreshQuotes}
                    isAdmin={isAdmin}
                    onManageUsers={isAdmin ? handleManageUsers : undefined}
                />
            )}
            {view === 'form' && (
                <QuoteForm
                    onBackToDashboard={() => setView('dashboard')}
                    onQuoteCreated={handleQuoteGenerated}
                    onValidationError={messages => setToast({ message: messages[0] || 'Please review the highlighted fields before continuing.', tone: 'error' })}
                />
            )}
            {view === 'users' && (
                <AdminUsersPanel onBack={() => setView('dashboard')} />
            )}
            {view !== 'users' && previewQuote && (
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

const AppContent = () => {
    const { status, isLoading: authLoading, user, signIn, signUp, error: authError, clearError } = useAuth();
    const [authPending, setAuthPending] = useState(false);

    const handleSignIn = async (email: string, password: string) => {
        setAuthPending(true);
        try {
            await signIn({ email, password });
        } catch (error) {
            // Error surface handled via auth context state.
        } finally {
            setAuthPending(false);
        }
    };

    const handleSignUp = async (email: string, password: string, fullName?: string) => {
        setAuthPending(true);
        try {
            await signUp({ email, password, fullName });
        } catch (error) {
            // Error surface handled via auth context state.
        } finally {
            setAuthPending(false);
        }
    };

    if (authLoading && status === 'loading') {
        return <LoadingScreen message="Checking your session…" />;
    }

    if (!user) {
        return (
            <div className="app-shell">
                <AuthScreen
                    onSignIn={handleSignIn}
                    onSignUp={handleSignUp}
                    isSubmitting={authPending || authLoading}
                    error={authError}
                    clearError={clearError}
                />
            </div>
        );
    }

    return <AuthenticatedApp />;
};

const App = () => (
    <AuthProvider>
        <QuotesProvider>
            <AppContent />
        </QuotesProvider>
    </AuthProvider>
);

export default App;
