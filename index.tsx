import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

declare global {
    interface Window {
        __APP_ROOT__?: ReturnType<typeof createRoot>;
    }
}

const container = document.getElementById('root');
if (container) {
    const root = window.__APP_ROOT__ || createRoot(container);
    root.render(<App />);
    window.__APP_ROOT__ = root;
}
