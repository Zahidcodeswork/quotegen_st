import React, { FormEvent, useEffect, useRef } from 'react';
import { INCLUSION_OPTIONS, SERVICE_OPTIONS, GOODS_OPTIONS, CLIENT_LOGO_PATH } from '../app/constants';
import { formatCurrency } from '../app/calculations';
import { useQuoteForm } from '../app/useQuoteForm';
import { ProcessedQuoteItem, QuoteItemInput, SavedQuote } from '../app/types';

interface QuoteFormProps {
    onBackToDashboard: () => void;
    onQuoteCreated: (quote: SavedQuote) => Promise<void>;
    onValidationError: (messages: string[]) => void;
}

const ITEM_CATEGORY_OPTIONS: Array<'General' | 'Fragile' | 'Irregular/Furniture'> = ['General', 'Fragile', 'Irregular/Furniture'];
const ITEM_PACKAGE_OPTIONS: Array<'Normal' | 'Crate' | 'Special'> = ['Normal', 'Crate', 'Special'];

const Stepper = ({ currentStep }: { currentStep: number }) => (
    <div className="stepper">
        {[1, 2, 3].map(step => (
            <React.Fragment key={step}>
                <div className={`step ${currentStep >= step ? 'active' : ''}`}>
                    <div className="step-number">{step}</div>
                    <div className="step-title">{['Customer', 'Shipment', 'Items'][step - 1]} Details</div>
                </div>
                {step < 3 && <div className="step-connector" />}
            </React.Fragment>
        ))}
    </div>
);

const ErrorMessage = ({ message }: { message?: string }) => (
    message ? <span className="form-error">{message}</span> : null
);

const CustomerStep = ({
    form,
    errors,
    updateField,
}: {
    form: ReturnType<typeof useQuoteForm>['form'];
    errors: Record<string, string>;
    updateField: (field: keyof typeof form, value: string) => void;
}) => (
    <fieldset className="form-section">
        <h2>Customer Information</h2>
        <div className="grid-container">
            <div className="form-group">
                <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder=" " />
                <label>Customer Name *</label>
                <ErrorMessage message={errors.name} />
            </div>
            <div className="form-group">
                <input type="tel" value={form.contactNumber} onChange={e => updateField('contactNumber', e.target.value)} placeholder=" " />
                <label>Contact Number *</label>
                <ErrorMessage message={errors.contactNumber} />
            </div>
            <div className="form-group">
                <input type="tel" value={form.whatsapp} onChange={e => updateField('whatsapp', e.target.value)} placeholder=" " />
                <label>WhatsApp Number</label>
            </div>
            <div className="form-group">
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder=" " />
                <label>Email Address</label>
                <ErrorMessage message={errors.email} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <input type="text" value={form.pickupLocation} onChange={e => updateField('pickupLocation', e.target.value)} placeholder=" " />
                <label>Pickup Location *</label>
                <ErrorMessage message={errors.pickupLocation} />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder=" " rows={3} />
                <label>Internal Notes</label>
            </div>
        </div>
    </fieldset>
);

const ShipmentStep = ({
    form,
    errors,
    updateField,
    toggleInclusion,
}: {
    form: ReturnType<typeof useQuoteForm>['form'];
    errors: Record<string, string>;
    updateField: (field: keyof typeof form, value: string) => void;
    toggleInclusion: (option: string, checked: boolean) => void;
}) => (
    <>
        <fieldset className="form-section">
            <h2>Shipment Details</h2>
            <div className="grid-container">
                <div className="form-group">
                    <select value={form.modeOfService} onChange={e => updateField('modeOfService', e.target.value)}>
                        <option value="" disabled>Select service...</option>
                        {SERVICE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <label>Mode of Service *</label>
                    <ErrorMessage message={errors.modeOfService} />
                </div>
                <div className="form-group">
                    <select value={form.typeOfGoods} onChange={e => updateField('typeOfGoods', e.target.value)}>
                        <option value="" disabled>Select type...</option>
                        {GOODS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <label>Type of Goods *</label>
                    <ErrorMessage message={errors.typeOfGoods} />
                </div>
                <div className="form-group">
                    <input type="text" value={form.deliveryLocation} onChange={e => updateField('deliveryLocation', e.target.value)} placeholder=" " />
                    <label>Delivery Location *</label>
                    <ErrorMessage message={errors.deliveryLocation} />
                </div>
                <div className="form-group">
                    <input type="text" value={form.deliveryCity} onChange={e => updateField('deliveryCity', e.target.value)} placeholder=" " />
                    <label>Delivery City *</label>
                    <ErrorMessage message={errors.deliveryCity} />
                </div>
                <div className="form-group">
                    <input type="text" value={form.deliveryCountry} onChange={e => updateField('deliveryCountry', e.target.value)} placeholder=" " />
                    <label>Delivery Country</label>
                </div>
                <div className="form-group">
                    <input type="text" value={form.transitTime} readOnly placeholder=" " />
                    <label>Transit Time</label>
                </div>
                <div className="form-group">
                    <input type="text" value={form.quoteNo} readOnly placeholder=" " />
                    <label>Quote Number</label>
                </div>
                <div className="form-group">
                    <input type="date" value={form.date} onChange={e => updateField('date', e.target.value)} />
                    <label>Date</label>
                </div>
                <div className="form-group">
                    <input type="date" value={form.validUntil} onChange={e => updateField('validUntil', e.target.value)} />
                    <label>Valid Until</label>
                </div>
                <div className="form-group">
                    <input type="text" value={form.surveyor} onChange={e => updateField('surveyor', e.target.value)} placeholder=" " />
                    <label>Surveyor</label>
                </div>
                <div className="form-group">
                    <select value={form.paymentMethod} onChange={e => updateField('paymentMethod', e.target.value)}>
                        <option value="" disabled>Select method...</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Payment Link">Payment Link</option>
                    </select>
                    <label>Preferred Payment Method</label>
                </div>
                <div className="form-group">
                    <select value={form.paymentStatus} onChange={e => updateField('paymentStatus', e.target.value)}>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <label>Payment Status</label>
                </div>
            </div>
        </fieldset>
        <fieldset className="form-section">
            <h2>Inclusions</h2>
            <div className="checkbox-grid">
                {INCLUSION_OPTIONS.map(option => (
                    <div key={option} className="checkbox-group">
                        <input
                            type="checkbox"
                            id={`inclusion-${option.replace(/\s+/g, '-')}`}
                            value={option}
                            checked={form.inclusions.includes(option)}
                            onChange={e => toggleInclusion(option, e.target.checked)}
                        />
                        <label htmlFor={`inclusion-${option.replace(/\s+/g, '-')}`}>{option}</label>
                    </div>
                ))}
            </div>
        </fieldset>
    </>
);

const ItemCard = ({
    index,
    item,
    errors,
    updateItem,
    removeItem,
    toggleItemSelection,
    canRemove,
}: {
    index: number;
    item: ProcessedQuoteItem;
    errors: Record<string, string>;
    updateItem: (id: number, field: keyof QuoteItemInput, value: any) => void;
    removeItem: (id: number) => void;
    toggleItemSelection: (id: number, checked: boolean) => void;
    canRemove: boolean;
}) => {
    const errorKey = (field: string) => `items.${index}.${field}`;

    return (
        <div className="item-card">
            <div className="item-header">
                <div>
                    <h3>{item.itemNumber}</h3>
                    <label className="inline-checkbox">
                        <input
                            type="checkbox"
                            checked={item.isSelected}
                            onChange={event => toggleItemSelection(item.id, event.target.checked)}
                        />
                        Include in quote
                    </label>
                    {item.requiresPhoto && (
                        <div className="item-hint">Photo audit required for irregular item.</div>
                    )}
                </div>
                {canRemove && (
                    <button type="button" className="btn btn-danger" onClick={() => removeItem(item.id)}>Remove</button>
                )}
            </div>
            <div className="item-grid">
                <div className="form-group grid-span-all">
                    <input type="text" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder=" " />
                    <label>Item Description *</label>
                    <ErrorMessage message={errors[errorKey('description')]} />
                </div>
                <div className="form-group">
                    <select value={item.category} onChange={e => updateItem(item.id, 'category', e.target.value)}>
                        <option value="" disabled>Select category...</option>
                        {ITEM_CATEGORY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <label>Category</label>
                </div>
                <div className="form-group">
                    <select value={item.packageType} onChange={e => updateItem(item.id, 'packageType', e.target.value)}>
                        <option value="" disabled>Select packaging...</option>
                        {ITEM_PACKAGE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <label>Packaging</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.length} onChange={e => updateItem(item.id, 'length', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Length (cm)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.breadth} onChange={e => updateItem(item.id, 'breadth', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Width (cm)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.height} onChange={e => updateItem(item.id, 'height', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Height (cm)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.actualWeight} onChange={e => updateItem(item.id, 'actualWeight', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Weight (kg)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value, 10) || 1)} placeholder=" " />
                    <label>Quantity *</label>
                    <ErrorMessage message={errors[errorKey('quantity')]} />
                </div>
                <div className="form-group">
                    <input type="number" value={item.value} onChange={e => updateItem(item.id, 'value', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Value (AED)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.ratePerKg} onChange={e => updateItem(item.id, 'ratePerKg', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Rate/kg (AED)</label>
                    <ErrorMessage message={errors[errorKey('ratePerKg')]} />
                </div>
                <div className="form-group">
                    <input type="number" value={item.packingCharge} onChange={e => updateItem(item.id, 'packingCharge', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Packing (AED)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.handlingCharge} onChange={e => updateItem(item.id, 'handlingCharge', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Handling (AED)</label>
                </div>
                <div className="form-group">
                    <input type="number" value={item.duty} onChange={e => updateItem(item.id, 'duty', parseFloat(e.target.value) || 0)} placeholder=" " />
                    <label>Duty (AED)</label>
                </div>
            </div>
            <div className="item-grid metrics-row">
                <div className="calculated-field">
                    <label>CBM</label>
                    <span>{item.cbm.toFixed(3)} m³</span>
                </div>
                <div className="calculated-field">
                    <label>Vol. Weight</label>
                    <span>{item.volumetricWeight.toFixed(2)} kg</span>
                </div>
                <div className="calculated-field">
                    <label>Billed Weight</label>
                    <span>{item.billedWeight.toFixed(2)} kg</span>
                </div>
                <div className="calculated-field">
                    <label>Line Total</label>
                    <span>{formatCurrency(item.lineTotal)}</span>
                </div>
            </div>
        </div>
    );
};

const ItemsStep = ({
    processedItems,
    errors,
    updateItem,
    removeItem,
    toggleItemSelection,
    addItem,
}: {
    processedItems: ProcessedQuoteItem[];
    errors: Record<string, string>;
    updateItem: (id: number, field: keyof QuoteItemInput, value: any) => void;
    removeItem: (id: number) => void;
    toggleItemSelection: (id: number, checked: boolean) => void;
    addItem: () => void;
}) => (
    <fieldset className="form-section">
        <h2>Item Details</h2>
        {processedItems.map((item, index) => (
            <ItemCard
                index={index}
                key={item.id}
                item={item}
                errors={errors}
                updateItem={updateItem}
                removeItem={removeItem}
                toggleItemSelection={toggleItemSelection}
                canRemove={processedItems.length > 1}
            />
        ))}
        <button type="button" className="add-item-btn" onClick={addItem}>+ Add Another Item</button>
    </fieldset>
);

const SummarySidebar = ({
    form,
    totals,
}: {
    form: ReturnType<typeof useQuoteForm>['form'];
    totals: ReturnType<typeof useQuoteForm>['totals'];
}) => (
    <aside className="summary-sidebar-desktop">
        <div className="summary-section">
            <h3>Quote Summary</h3>
            <div className="summary-item"><span>Quote #</span><span className="summary-value">{form.quoteNo}</span></div>
            <div className="summary-item"><span>Service</span><span className="summary-value">{form.modeOfService || 'N/A'}</span></div>
            <div className="summary-item"><span>Total Billed Wt.</span><span className="summary-value">{totals.totalBilledWeight.toFixed(2)} kg</span></div>
            <div className="summary-item"><span>Selected Items</span><span className="summary-value">{totals.selectedCount}</span></div>
            <div className="summary-item"><span>Payment Method</span><span className="summary-value">{form.paymentMethod || 'TBD'}</span></div>
            <div className="summary-item"><span>Payment Status</span><span className="summary-value">{form.paymentStatus}</span></div>
            <hr className="summary-divider" />
            <div className="summary-item"><span>Subtotal</span><span className="summary-value">{formatCurrency(totals.subtotal)}</span></div>
            <div className="summary-item grand-total"><span>Grand Total</span><span className="summary-value">{formatCurrency(totals.grandTotal)}</span></div>
        </div>
    </aside>
);

const QuoteForm: React.FC<QuoteFormProps> = ({ onBackToDashboard, onQuoteCreated, onValidationError }) => {
    const quoteForm = useQuoteForm();
    const {
        step,
        form,
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
    } = quoteForm;

    const skipDraftSaveRef = useRef(false);
    const latestSaveDraftRef = useRef(saveDraft);

    useEffect(() => {
        latestSaveDraftRef.current = saveDraft;
    }, [saveDraft]);

    useEffect(() => {
        skipDraftSaveRef.current = false;
        return () => {
            if (!skipDraftSaveRef.current) {
                void latestSaveDraftRef.current();
            }
        };
    }, []);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (step < 3) {
            goToStep(step + 1);
            return;
        }
        const result = generateQuote();
        if (!result.success) {
            onValidationError(result.errors?.map(error => error.message) ?? []);
            return;
        }
        if (result.quote) {
            skipDraftSaveRef.current = true;
            try {
                await onQuoteCreated(result.quote);
                reset();
            } catch (error) {
                console.error('Failed to create quote', error);
            }
        }
    };

    const handleViewDashboard = async () => {
        await latestSaveDraftRef.current();
        skipDraftSaveRef.current = true;
        onBackToDashboard();
    };

    return (
        <div className="app-container">
            <header>
                <div className="header-brand">
                    <img src={CLIENT_LOGO_PATH} alt="Client brand logo" className="brand-logo" />
                    <div>
                        <h1>Create Quotation</h1>
                        <p className="text-muted">Capture customer details, build items, and preview the final quote in one flow.</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={handleViewDashboard}>View Dashboard</button>
            </header>
            <Stepper currentStep={step} />
            <main className="form-content">
                <form className="main-form" onSubmit={handleSubmit}>
                    {step === 1 && (
                        <CustomerStep form={form} errors={errors} updateField={updateField as any} />
                    )}
                    {step === 2 && (
                        <ShipmentStep form={form} errors={errors} updateField={updateField as any} toggleInclusion={toggleInclusion} />
                    )}
                    {step === 3 && (
                        <ItemsStep
                            processedItems={processedItems}
                            errors={errors}
                            updateItem={updateItem as any}
                            removeItem={removeItem}
                            toggleItemSelection={toggleItemSelection}
                            addItem={addItem}
                        />
                    )}
                    {errors.items && (
                        <div className="form-error-block">{errors.items}</div>
                    )}
                    <div className="navigation-buttons">
                        {step > 1 && (
                            <button type="button" className="btn btn-secondary" onClick={() => goToStep(step - 1)}>
                                Back
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary">
                            {step < 3 ? 'Next' : 'Preview Quote'}
                        </button>
                    </div>
                </form>
                <SummarySidebar form={form} totals={totals} />
            </main>
        </div>
    );
};

export default QuoteForm;
