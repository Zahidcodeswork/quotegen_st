import { ModeOfService, GoodsType } from './types';

export const INCLUSION_OPTIONS = [
    'Door to door service',
    'Packing',
    'Customs clearance at Origin',
    'Customs clearance at Destination',
    'Insurance',
    'Fumigation',
    'Certificate of Origin',
];

export const SERVICE_OPTIONS: ModeOfService[] = ['Sea Freight', 'Air Freight'];
export const GOODS_OPTIONS: GoodsType[] = ['Personal Goods', 'Commercial'];

export const DEFAULT_COUNTRY = 'India';
export const VOLUMETRIC_WEIGHT_DIVISOR = 5000;
export const QUOTE_VALIDITY_DAYS = 7;

export const TERMS_AND_CONDITIONS = [
    'The charges specified include expenses up to the designated destination.',
    'No physical presence of the consignee with the original passport is mandated for clearance at the port of destination.',
    'Payment should be made in full (100%) in advance or at the time of invoicing. An initial payment of 20% of the quoted amount is required prior to the commencement of packing.',
    'Any variation in the volume or actual weight of the cargo after packing will result in an adjustment to the quoted amount.',
    'Custom duties will apply to electronics, brand-new furniture, and other expensive items based on the item\'s cost/invoice value. Any unforeseen duties incurred shall be borne by the customer.',
    'Both the actual weight and volumetric weight will be recorded upon collection. The greater of these two weights is considered as the chargeable weight on the invoice.',
    'For oversized cargo exceeding standard dimensions, additional handling charges may apply.',
    'Basic insurance is included in the quote for up to AED 20/kg. For valuable items or comprehensive/full insurance coverage, customer is recommended to obtain 3rd party insurance.',
    'Fragile items are shipped under the customer responsibility. Wooden box packaging is recommended for fragile cargo to ensure its safety during transit. Customer is recommended adhering to industry standards for packaging. Failure to meet packaging requirements may impact the safety and handling of your shipment.',
    'Delivery times quoted are tentative and vary based on the destination. Delivery time may change depending upon clearance procedures.',
    'ST Courier will not be liable or responsible for loss, damage, or delay caused by events beyond our control, such as delays in customs clearance procedures or those of other regulatory agencies or of natural calamity.',
    'To cancel a shipment, please notify us at least 48 hours before the scheduled departure. A cancellation fee of 10% of the total invoice value, plus packing and documentation charges, will be applicable. Return delivery charges are extra.',
    'If the shipment is rejected or returned for any reason, applicable penalties shall be borne by the customer.',
    'Complaints or damage claims will not be accepted after 48 hours of accepted delivery. If eligible, the maximum compensation amount is limited to AED 20 per kg.',
    'ST Courier will not be liable for goods seized by customs authorities due to violations of import/export regulations. Customers are responsible for complying with all relevant laws and regulations.',
    'Certain goods are prohibited for shipment, including hazardous materials, illegal substances, and items restricted by international regulations. ST Courier reserves the right to refuse shipment of prohibited goods.',
    'The provided quotation is valid for a period of 2 weeks from the current date. ST Courier reserves the right to withdraw the quotation.',
];

export const CLIENT_LOGO_PATH = '/client-logo.svg';

export const SERVICE_BACKGROUND_MAP: Record<string, string> = {
    'Sea Freight': '/sea-bg.svg',
    'Air Freight': '/air-bg.svg',
};
