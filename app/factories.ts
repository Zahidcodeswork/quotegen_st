import { DEFAULT_COUNTRY, INCLUSION_OPTIONS, QUOTE_VALIDITY_DAYS } from './constants';
import { QuoteFormData, QuoteItemInput } from './types';

const getDateInputValue = (date: Date): string => date.toISOString().split('T')[0];

export const createInitialFormData = (): QuoteFormData => {
    const today = new Date();
    const validUntil = new Date(today.getTime() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    return {
        name: '',
        contactNumber: '',
        email: '',
        whatsapp: '',
        pickupLocation: '',
        deliveryLocation: '',
        deliveryCity: '',
        deliveryCountry: DEFAULT_COUNTRY,
        modeOfService: '',
        typeOfGoods: '',
        transitTime: '',
        quoteNo: '',
        date: getDateInputValue(today),
        validUntil: getDateInputValue(validUntil),
        surveyor: '',
        inclusions: [],
        paymentMethod: '',
        paymentStatus: 'Pending',
        notes: '',
    };
};

export const createInitialItem = (index = 0, seedRate = 0): QuoteItemInput => ({
    id: Date.now() + index,
    itemNumber: `Item ${index + 1}`,
    description: '',
    quantity: 1,
    category: '',
    packageType: '',
    length: 0,
    breadth: 0,
    height: 0,
    actualWeight: 0,
    value: 0,
    ratePerKg: seedRate,
    packingCharge: 0,
    handlingCharge: 0,
    duty: 0,
    isSelected: true,
    requiresPhoto: false,
});

export const cloneItemWithIndex = (item: QuoteItemInput, index: number, total: number): QuoteItemInput => ({
    ...item,
    itemNumber: `Item ${index + 1} of ${total}`,
});

export const normalizeItems = (items: QuoteItemInput[]): QuoteItemInput[] =>
    items.map((item, index, array) => cloneItemWithIndex(item, index, array.length));
