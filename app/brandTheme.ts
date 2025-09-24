// Centralized brand tokens for ST Courier
// Keep values in sync with index.css root variables

export const brandColors = {
    primary: '#13293e',      // ST Navy
    primaryLight: '#e6edf4', // Light navy tint
    accent: '#b62b35',       // ST Red
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#d1d5db',
    surface: '#ffffff',
    background: '#f9fafb',
};

export const brandFonts = {
    // Google Sans is referenced in the brand guide. Use it if present on the system,
    // otherwise fall back to common UI stacks.
    base: "'Google Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

export type BrandTheme = {
    colors: typeof brandColors;
    fonts: typeof brandFonts;
};

export const brandTheme: BrandTheme = {
    colors: brandColors,
    fonts: brandFonts,
};

