import { formatCurrency } from './calculations';
import { TERMS_AND_CONDITIONS, CLIENT_LOGO_PATH, SERVICE_BACKGROUND_MAP } from './constants';
import { SavedQuote } from './types';

declare const jspdf: any;

interface ImageMetrics {
    dataUrl: string;
    width: number;
    height: number;
}

const assetCache = new Map<string, ImageMetrics>();

interface ImageOptions {
    opacity?: number;
}

const resolveImageMetrics = async (path: string, options: ImageOptions = {}): Promise<ImageMetrics | null> => {
    if (!path) return null;
    if (assetCache.has(path)) {
        return assetCache.get(path) ?? null;
    }
    if (typeof document === 'undefined') {
        return null;
    }
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const width = img.naturalWidth || img.width || 400;
                const height = img.naturalHeight || img.height || 150;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d');
                if (!context) {
                    reject(new Error(`Unable to access canvas context for asset: ${path}`));
                    return;
                }
                const opacity = typeof options.opacity === 'number' ? options.opacity : 1;
                if (opacity < 1) {
                    context.globalAlpha = opacity;
                }
                context.drawImage(img, 0, 0, width, height);
                context.globalAlpha = 1;
                const metrics: ImageMetrics = {
                    dataUrl: canvas.toDataURL('image/png'),
                    width,
                    height,
                };
                assetCache.set(path, metrics);
                resolve(metrics);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = reject;
        img.src = path;
    });
};

export const generateQuotePDF = async (quote: SavedQuote): Promise<void> => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const navyColor = '#13293e';
    const accentColor = '#b62b35';
    const lightNavy = '#e6edf4';
    const footerReserve = margin + 10;

    const backgroundPath = SERVICE_BACKGROUND_MAP[quote.formData.modeOfService] ?? '';
    let backgroundMetrics: ImageMetrics | null = null;
    if (backgroundPath) {
        try {
            backgroundMetrics = await resolveImageMetrics(backgroundPath, { opacity: 0.2 });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('Failed to load background asset:', error);
        }
    }

    const drawBackground = () => {
        if (!backgroundMetrics) return;
        const scale = Math.max(pageWidth / backgroundMetrics.width, pageHeight / backgroundMetrics.height);
        const displayWidth = backgroundMetrics.width * scale;
        const displayHeight = backgroundMetrics.height * scale;
        const offsetX = (pageWidth - displayWidth) / 2;
        const offsetY = (pageHeight - displayHeight) / 2;
        doc.addImage(backgroundMetrics.dataUrl, 'PNG', offsetX, offsetY, displayWidth, displayHeight);
    };

    drawBackground();

    let logoMetrics: ImageMetrics | null = null;
    try {
        logoMetrics = await resolveImageMetrics(CLIENT_LOGO_PATH, { opacity: 1 });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to render ST logo in PDF:', error);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(navyColor);
    const companyInfoText = [
        'ST Courier',
        'Dubai, United Arab Emirates',
        'support@stcourier.ae',
        'Contact: +971 50 628 1238',
        'Toll Free: 800 1238',
    ].join('\n');
    if (logoMetrics) {
        const displayWidth = 70;
        const aspectRatio = logoMetrics.height / logoMetrics.width;
        const displayHeight = displayWidth * aspectRatio;
        doc.addImage(logoMetrics.dataUrl, 'PNG', margin, 15, displayWidth, displayHeight);
        const companyInfoY = 15 + displayHeight + 6;
        doc.text(companyInfoText, margin, companyInfoY);
    } else {
        doc.text(companyInfoText, margin, 42);
    }

    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth - margin, 35, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Quote #: ${quote.quoteNo}`, pageWidth - margin, 45, { align: 'right' });
    doc.text(`Date: ${new Date(quote.date).toLocaleDateString()}`, pageWidth - margin, 50, { align: 'right' });
    doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, pageWidth - margin, 55, { align: 'right' });

    doc.setLineWidth(0.5);
    doc.line(margin, 70, pageWidth - margin, 70);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BILL TO:', margin, 80);
    doc.text('SHIPMENT INFO:', pageWidth / 2, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const clientDetails = [
        quote.formData.name,
        quote.formData.contactNumber,
        quote.formData.email,
        `Pickup: ${quote.formData.pickupLocation}`,
    ].filter(Boolean).join('\n');
    doc.text(clientDetails, margin, 86);

    const shipmentDetails = [
        `Service: ${quote.formData.modeOfService}`,
        `Goods: ${quote.formData.typeOfGoods}`,
        `Destination: ${quote.formData.deliveryLocation}, ${quote.formData.deliveryCity}, ${quote.formData.deliveryCountry}`,
        quote.formData.transitTime ? `Transit Time: ${quote.formData.transitTime}` : '',
    ].filter(Boolean).join('\n');
    doc.text(shipmentDetails, pageWidth / 2, 86);

    let tableStartY = 115;

    if (quote.formData.inclusions && quote.formData.inclusions.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('INCLUSIONS:', margin, 105);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const inclusionsText = quote.formData.inclusions.map(inc => `• ${inc}`).join('\n');
        doc.text(inclusionsText, margin, 111);
        const textHeight = doc.getTextDimensions(inclusionsText).h;
        tableStartY = 111 + textHeight + 5;
    }

    const tableHeaders = [
        'Item #',
        'Description',
        'Dimensions',
        'Actual Wt',
        'Vol. Wt',
        'Billed Wt',
        'Qty',
        'Rate/kg',
        'Packing',
        'Handling',
        'Duty',
        'Line Total (AED)',
    ];

    const tableBody = quote.items.map(item => [
        item.itemNumber,
        item.description,
        `${item.length}x${item.breadth}x${item.height} cm`,
        `${item.actualWeight.toFixed(2)} kg`,
        `${item.volumetricWeight.toFixed(2)} kg`,
        `${item.billedWeight.toFixed(2)} kg`,
        item.quantity,
        item.ratePerKg.toFixed(2),
        item.packingCharge.toFixed(2),
        item.handlingCharge.toFixed(2),
        item.duty.toFixed(2),
        item.lineTotal.toFixed(2),
    ]);

    (doc as any).autoTable({
        startY: tableStartY,
        head: [tableHeaders],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, halign: 'left' },
        bodyStyles: { textColor: '#1f2937' },
        alternateRowStyles: { fillColor: '#f4f7fa' },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 11: { halign: 'right' } },
        didParseCell: (data: any) => {
            if (data.section === 'body' && data.column.index === 11) {
                data.cell.styles.halign = 'right';
            }
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    const totalsBoxWidth = 82;
    const totalsBoxHeight = 36;
    const totalsX = pageWidth - margin - totalsBoxWidth;
    const totalsY = finalY + 14;

    doc.setFillColor(lightNavy);
    doc.setDrawColor(navyColor);
    doc.roundedRect(totalsX, totalsY, totalsBoxWidth, totalsBoxHeight, 3, 3, 'FD');

    doc.setTextColor(navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Totals', totalsX + 4, totalsY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Subtotal', totalsX + 4, totalsY + 16);
    doc.text(formatCurrency(quote.totals.subtotal), totalsX + totalsBoxWidth - 4, totalsY + 16, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total', totalsX + 4, totalsY + 27);
    doc.text(formatCurrency(quote.totals.grandTotal), totalsX + totalsBoxWidth - 4, totalsY + 27, { align: 'right' });

    doc.setDrawColor(accentColor);
    doc.setLineWidth(0.5);
    doc.line(margin, totalsY - 6, pageWidth - margin, totalsY - 6);
    doc.setDrawColor('#d1d5db');
    doc.setLineWidth(0.2);

    let currentY = totalsY + totalsBoxHeight + 14;
    const ensureSpace = (height: number) => {
        if (currentY + height > pageHeight - footerReserve) {
            doc.addPage();
            drawBackground();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor('#1f2937');
            currentY = margin;
        }
    };

    ensureSpace(6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(navyColor);
    doc.text('Terms & Conditions', margin, currentY);
    currentY += 6;

    const termFontSize = 7.5;
    const termLineHeight = 3.2;
    const termGap = 1.2;

    TERMS_AND_CONDITIONS.forEach((term, index) => {
        const numberedTerm = `${index + 1}. ${term}`;
        const wrappedTerm = doc.splitTextToSize(numberedTerm, pageWidth - margin * 2);
        const blockHeight = wrappedTerm.length * termLineHeight + termGap;
        ensureSpace(blockHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(termFontSize);
        doc.setTextColor('#1f2937');
        wrappedTerm.forEach(line => {
            doc.text(line, margin, currentY);
            currentY += termLineHeight;
        });
        currentY += termGap;
    });

    ensureSpace(10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor('#6b7280');
    doc.text('Thank you for your business!', pageWidth / 2, currentY + 6, { align: 'center' });

    doc.save(`Quotation-${quote.quoteNo}.pdf`);
};
