import { QuoteFormData, QuoteItemInput, QuoteValidationError } from './types';

const required = (value: string | number): boolean => {
    if (typeof value === 'number') return value > 0;
    return value.trim().length > 0;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-()\s]{6,}$/;

export const validateForm = (form: QuoteFormData): QuoteValidationError[] => {
    const errors: QuoteValidationError[] = [];

    if (!required(form.name)) errors.push({ field: 'name', message: 'Customer name is required.' });
    if (!required(form.contactNumber)) errors.push({ field: 'contactNumber', message: 'Contact number is required.' });
    if (form.contactNumber && !phonePattern.test(form.contactNumber)) {
        errors.push({ field: 'contactNumber', message: 'Enter a valid phone number.' });
    }
    if (form.email && !emailPattern.test(form.email)) {
        errors.push({ field: 'email', message: 'Enter a valid email address.' });
    }
    if (!required(form.pickupLocation)) errors.push({ field: 'pickupLocation', message: 'Pickup location is required.' });
    if (!required(form.modeOfService)) errors.push({ field: 'modeOfService', message: 'Select a mode of service.' });
    if (!required(form.typeOfGoods)) errors.push({ field: 'typeOfGoods', message: 'Select the type of goods.' });
    if (!required(form.deliveryLocation)) errors.push({ field: 'deliveryLocation', message: 'Delivery location is required.' });
    if (!required(form.deliveryCity)) errors.push({ field: 'deliveryCity', message: 'Delivery city is required.' });

    return errors;
};

export const validateItems = (items: QuoteItemInput[]): QuoteValidationError[] => {
    const errors: QuoteValidationError[] = [];

    if (!items.some(item => item.isSelected)) {
        errors.push({ field: 'items', message: 'Select at least one item for the quote.' });
    }

    items.forEach((item, index) => {
        if (!required(item.description)) {
            errors.push({ field: `items.${index}.description`, message: `Item ${index + 1} requires a description.` });
        }
        if (item.quantity <= 0) {
            errors.push({ field: `items.${index}.quantity`, message: `Item ${index + 1} quantity must be greater than zero.` });
        }
        if (item.ratePerKg < 0) {
            errors.push({ field: `items.${index}.ratePerKg`, message: `Item ${index + 1} rate cannot be negative.` });
        }
    });

    return errors;
};

export const summarizeErrors = (errors: QuoteValidationError[]): string => {
    if (errors.length === 0) return '';
    const unique = Array.from(new Set(errors.map(error => error.message)));
    return unique.join('\n');
};
