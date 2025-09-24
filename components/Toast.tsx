import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    tone?: 'success' | 'error' | 'info';
    onDismiss: () => void;
    duration?: number;
}

const toneClass: Record<NonNullable<ToastProps['tone']>, string> = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
};

const Toast: React.FC<ToastProps> = ({ message, tone = 'info', onDismiss, duration = 4000 }) => {
    useEffect(() => {
        const timer = window.setTimeout(onDismiss, duration);
        return () => window.clearTimeout(timer);
    }, [duration, onDismiss]);

    return (
        <div className={`toast ${toneClass[tone]}`} role="status">
            <span>{message}</span>
            <button className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">×</button>
        </div>
    );
};

export default Toast;
