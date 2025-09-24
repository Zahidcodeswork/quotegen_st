import React from 'react';
import { formatCurrency } from '../app/calculations';
import { CLIENT_LOGO_PATH, TERMS_AND_CONDITIONS } from '../app/constants';
import { SavedQuote } from '../app/types';

interface QuotePreviewModalProps {
    quote: SavedQuote;
    isDraft: boolean;
    onClose: () => void;
    onSave: (quote: SavedQuote) => Promise<void> | void;
    onDownloadPdf: (quote: SavedQuote) => void | Promise<void>;
    onVoid: (quote: SavedQuote) => Promise<SavedQuote | null> | void;
}

const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ quote, isDraft, onClose, onSave, onDownloadPdf, onVoid }) => (
    <div className="modal-overlay">
        <div className="modal-content">
            <div className="modal-header">
                <img src={CLIENT_LOGO_PATH} alt="ST Courier logo" className="brand-logo" />
                <div>
                    <h2>Quotation - {quote.quoteNo}</h2>
                    <p className="text-muted">Generated on {new Date(quote.date).toLocaleDateString()}</p>
                </div>
                <button onClick={onClose} className="close-modal-btn" aria-label="Close preview">&times;</button>
            </div>
            <div className="modal-body">
                {isDraft && (
                    <div className="unsaved-banner">
                        This quote is not yet saved. Choose "Save to Dashboard" or "Download PDF" to keep it.
                    </div>
                )}
                {quote.status === 'Voided' && (
                    <div className="void-reason-badge">
                        <strong>Voided:</strong> {quote.voidReason}
                    </div>
                )}
                <div className="quote-details-grid">
                    <div>
                        <h3>Client Details</h3>
                        <p><strong>Name:</strong> {quote.formData.name}</p>
                        <p><strong>Contact:</strong> {quote.formData.contactNumber}</p>
                        {quote.formData.email && <p><strong>Email:</strong> {quote.formData.email}</p>}
                        <p><strong>Pickup:</strong> {quote.formData.pickupLocation}</p>
                    </div>
                    <div>
                        <h3>Shipment Details</h3>
                        <p><strong>Service:</strong> {quote.formData.modeOfService}</p>
                        <p><strong>Destination:</strong> {quote.formData.deliveryCity}, {quote.formData.deliveryCountry}</p>
                        <p><strong>Transit:</strong> {quote.formData.transitTime || '—'}</p>
                        <p><strong>Payment:</strong> {quote.formData.paymentMethod || 'TBD'} ({quote.formData.paymentStatus})</p>
                        {quote.formData.notes && <p><strong>Notes:</strong> {quote.formData.notes}</p>}
                    </div>
                    {quote.formData.inclusions.length > 0 && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <h3>Inclusions</h3>
                            <ul className="inclusions-list">
                                {quote.formData.inclusions.map(inclusion => <li key={inclusion}>{inclusion}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
                <h3>Items</h3>
                <table className="modal-table">
                    <thead>
                        <tr>
                            <th>Item #</th>
                            <th>Description</th>
                            <th>Billed Wt. (kg)</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.items.map(item => (
                            <tr key={item.id}>
                                <td>{item.itemNumber}</td>
                                <td>{item.description}</td>
                                <td>{item.billedWeight.toFixed(2)}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.ratePerKg)}</td>
                                <td>{formatCurrency(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="modal-summary">
                    <div className="summary-item"><span>Subtotal</span><span className="summary-value">{formatCurrency(quote.totals.subtotal)}</span></div>
                    <div className="summary-item grand-total"><span>Grand Total</span><span className="summary-value">{formatCurrency(quote.totals.grandTotal)}</span></div>
                </div>
                <section className="quote-terms">
                    <h3>Terms &amp; Conditions</h3>
                    <ol>
                        {TERMS_AND_CONDITIONS.map((term, index) => (
                            <li key={index}>{term}</li>
                        ))}
                    </ol>
                </section>
            </div>
            <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>Close</button>
                {quote.status !== 'Voided' && (
                    <button className="btn btn-danger" onClick={() => { void onVoid(quote); }}>Void Quote</button>
                )}
                {isDraft && (
                    <button className="btn btn-primary" onClick={() => { void onSave(quote); }}>Save to Dashboard</button>
                )}
                <button className="btn btn-primary" onClick={() => { void onDownloadPdf(quote); }}>Download PDF</button>
            </div>
        </div>
    </div>
);

export default QuotePreviewModal;
