export type ModeOfService = 'Sea Freight' | 'Air Freight';
export type GoodsType = 'Personal Goods' | 'Commercial';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Payment Link';
export type PaymentStatus = 'Pending' | 'Partial' | 'Completed';
export type QuoteStatus = 'Draft' | 'Active' | 'Converted' | 'Expired' | 'Voided';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserRole = 'user' | 'admin';

export interface UserProfile {
    id: string;
    email: string | null;
    role: UserRole;
    fullName?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface QuoteFormData {
    name: string;
    contactNumber: string;
    email: string;
    whatsapp: string;
    pickupLocation: string;
    deliveryLocation: string;
    deliveryCity: string;
    deliveryCountry: string;
    modeOfService: ModeOfService | '';
    typeOfGoods: GoodsType | '';
    transitTime: string;
    quoteNo: string;
    date: string;
    validUntil: string;
    surveyor: string;
    inclusions: string[];
    paymentMethod: PaymentMethod | '';
    paymentStatus: PaymentStatus;
    notes: string;
}

export interface QuoteItemInput {
    id: number;
    itemNumber: string;
    description: string;
    quantity: number;
    category: 'General' | 'Fragile' | 'Irregular/Furniture' | '';
    packageType: 'Normal' | 'Crate' | 'Special' | '';
    length: number;
    breadth: number;
    height: number;
    actualWeight: number;
    value: number;
    ratePerKg: number;
    packingCharge: number;
    handlingCharge: number;
    duty: number;
    isSelected: boolean;
    requiresPhoto: boolean;
    photoBeforePacking?: string;
    photoAfterPacking?: string;
}

export interface ProcessedQuoteItem extends QuoteItemInput {
    cbm: number;
    volumetricWeight: number;
    billedWeight: number;
    unitCost: number;
    lineTotal: number;
}

export interface QuoteTotals {
    subtotal: number;
    grandTotal: number;
    totalCBM: number;
    totalBilledWeight: number;
    selectedCount: number;
}

export interface SavedQuote {
    quoteNo: string;
    date: string;
    validUntil: string;
    formData: QuoteFormData;
    items: ProcessedQuoteItem[];
    totals: QuoteTotals;
    status: QuoteStatus;
    voidReason?: string;
    approvalRequired?: boolean;
    approvalStatus?: ApprovalStatus;
    modifiedBy?: string;
    originalQuoteData?: SavedQuote;
    id?: string;
    userId?: string;
    ownerEmail?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface QuoteDraftState {
    form: QuoteFormData;
    items: QuoteItemInput[];
}

export interface QuoteValidationError {
    field: string;
    message: string;
}
