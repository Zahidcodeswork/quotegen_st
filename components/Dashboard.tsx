import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../app/calculations';
import { CLIENT_LOGO_PATH } from '../app/constants';
import { SavedQuote, QuoteStatus } from '../app/types';

interface DashboardProps {
    quotes: SavedQuote[];
    onCreateNew: () => void;
    onPreview: (quote: SavedQuote) => void;
    onVoid: (quote: SavedQuote) => Promise<SavedQuote | null> | void;
    onSignOut: () => Promise<void> | void;
    userEmail: string | null;
    loading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
    isAdmin?: boolean;
    onManageUsers?: () => void;
}

const statusLabels: Record<QuoteStatus, string> = {
    Draft: 'Draft',
    Active: 'Active',
    Converted: 'Converted',
    Expired: 'Expired',
    Voided: 'Voided',
};

const statusFilters: QuoteStatus[] = ['Active', 'Draft', 'Converted', 'Expired', 'Voided'];

export const Dashboard: React.FC<DashboardProps> = ({
    quotes,
    onCreateNew,
    onPreview,
    onVoid,
    onSignOut,
    userEmail,
    loading,
    error,
    onRefresh,
    isAdmin,
    onManageUsers,
}) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'All'>('All');

    const filteredQuotes = useMemo(() => {
        const term = search.trim().toLowerCase();
        return quotes.filter(quote => {
            const matchesSearch = !term ||
                quote.quoteNo.toLowerCase().includes(term) ||
                quote.formData.name.toLowerCase().includes(term) ||
                quote.formData.contactNumber.toLowerCase().includes(term) ||
                (isAdmin && quote.ownerEmail?.toLowerCase().includes(term));
            const matchesStatus = statusFilter === 'All' || quote.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [isAdmin, quotes, search, statusFilter]);

    const statusCounts = useMemo(() => {
        return statusFilters.reduce<Record<QuoteStatus, number>>((acc, status) => {
            acc[status] = quotes.filter(quote => quote.status === status).length;
            return acc;
        }, {
            Active: 0,
            Draft: 0,
            Converted: 0,
            Expired: 0,
            Voided: 0,
        });
    }, [quotes]);

    return (
        <div className="app-container">
            <header>
                <div className="header-brand">
                    <img src={CLIENT_LOGO_PATH} alt="Client brand logo" className="brand-logo" />
                    <div>
                        <h1>Quote Dashboard</h1>
                        <p className="text-muted">Monitor, filter, and manage all generated quotations.</p>
                        {userEmail && <p className="text-muted" style={{ fontSize: '0.85rem' }}>Signed in as {userEmail}</p>}
                    </div>
                </div>
                <div className="dashboard-actions">
                    {isAdmin && onManageUsers && (
                        <button className="btn btn-secondary" onClick={onManageUsers}>Manage Users</button>
                    )}
                    {onRefresh && (
                        <button className="btn btn-secondary" onClick={() => { void onRefresh(); }}>Refresh</button>
                    )}
                    <button className="btn btn-secondary" onClick={() => { void onSignOut(); }}>Sign Out</button>
                    <button className="btn btn-primary" onClick={onCreateNew}>Create New Quote</button>
                </div>
            </header>
            <div className="dashboard-container">
                {error && (
                    <div className="form-error-block" role="alert" style={{ marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                <div className="dashboard-summary">
                    {statusFilters.map(status => (
                        <div key={status} className="summary-card">
                            <span className="summary-label">{statusLabels[status]}</span>
                            <strong>{statusCounts[status]}</strong>
                        </div>
                    ))}
                </div>
                <div className="dashboard-header">
                    <div className="dashboard-search">
                        <input
                            type="text"
                            placeholder="Search by quote number, client, or phone"
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                        />
                    </div>
                    <div className="dashboard-filters">
                        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value as QuoteStatus | 'All')}>
                            <option value="All">All statuses</option>
                            {statusFilters.map(status => (
                                <option key={status} value={status}>{statusLabels[status]}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {loading ? (
                    <div className="empty-dashboard">
                        <p>Loading quotes…</p>
                    </div>
                ) : filteredQuotes.length > 0 ? (
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Quote #</th>
                                <th>Client</th>
                                <th>Service</th>
                                <th>Destination</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Date</th>
                                {isAdmin && <th>Owner</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotes.map(quote => (
                                <tr key={quote.quoteNo} className={quote.status === 'Voided' ? 'voided-quote' : ''}>
                                    <td>{quote.quoteNo}</td>
                                    <td>
                                        <div className="table-primary-text">{quote.formData.name}</div>
                                        <small className="text-muted">{quote.formData.contactNumber}</small>
                                    </td>
                                    <td>{quote.formData.modeOfService || '—'}</td>
                                    <td>{quote.formData.deliveryCity}, {quote.formData.deliveryCountry}</td>
                                    <td>{formatCurrency(quote.totals.grandTotal)}</td>
                                    <td><span className={`status-badge status-${quote.status.toLowerCase()}`}>{statusLabels[quote.status]}</span></td>
                                    <td>{new Date(quote.date).toLocaleDateString()}</td>
                                    {isAdmin && <td>{quote.ownerEmail ?? '—'}</td>}
                                    <td>
                                        <button className="btn btn-secondary" onClick={() => onPreview(quote)}>View</button>
                                        {quote.status !== 'Voided' && (
                                            <button className="btn btn-danger" onClick={() => { void onVoid(quote); }}>Void</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-dashboard">
                        <p>{quotes.length === 0 ? "You haven't created any quotes yet." : 'No quotes match your filters.'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
