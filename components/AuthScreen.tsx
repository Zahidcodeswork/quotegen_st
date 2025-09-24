import React, { FormEvent, useState } from 'react';
import { CLIENT_LOGO_PATH } from '../app/constants';

interface AuthScreenProps {
    onSignIn: (email: string, password: string) => Promise<void>;
    onSignUp: (email: string, password: string, fullName?: string) => Promise<void>;
    isSubmitting: boolean;
    error?: string | null;
    clearError: () => void;
}

const initialFormState = {
    email: '',
    password: '',
    fullName: '',
};

const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn, onSignUp, isSubmitting, error, clearError }) => {
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
    const [form, setForm] = useState(initialFormState);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (error) clearError();
        if (localError) setLocalError(null);
        setForm(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!form.email || !form.password) {
            setLocalError('Email and password are required.');
            return;
        }
        if (mode === 'signUp' && form.password.length < 8) {
            setLocalError('Password must be at least 8 characters.');
            return;
        }
        try {
            if (mode === 'signIn') {
                await onSignIn(form.email, form.password);
            } else {
                await onSignUp(form.email, form.password, form.fullName || undefined);
            }
        } catch (submissionError) {
            // Error surface is handled via parent context.
        }
    };

    const toggleMode = () => {
        setMode(current => (current === 'signIn' ? 'signUp' : 'signIn'));
        setLocalError(null);
        clearError();
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img src={CLIENT_LOGO_PATH} alt="ST Courier logo" />
                </div>
                <h1>{mode === 'signIn' ? 'Welcome back' : 'Create your account'}</h1>
                <p className="text-muted">Access your quotations from any device.</p>
                <form onSubmit={handleSubmit} className="auth-form">
                    <label>
                        Email
                        <input
                            type="email"
                            value={form.email}
                            onChange={handleChange('email')}
                            placeholder="you@example.com"
                            autoComplete="email"
                        />
                    </label>
                    {mode === 'signUp' && (
                        <label>
                            Full name (optional)
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={handleChange('fullName')}
                                placeholder="Jane Doe"
                                autoComplete="name"
                            />
                        </label>
                    )}
                    <label>
                        Password
                        <input
                            type="password"
                            value={form.password}
                            onChange={handleChange('password')}
                            placeholder="••••••••"
                            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                        />
                    </label>
                    {(localError || error) && (
                        <div className="form-error-block" role="alert">
                            {localError || error}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
                    </button>
                </form>
                <p className="auth-toggle">
                    {mode === 'signIn' ? (
                        <>
                            Need an account?{' '}
                            <button type="button" className="btn-link" onClick={toggleMode}>
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already registered?{' '}
                            <button type="button" className="btn-link" onClick={toggleMode}>
                                Sign in
                            </button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default AuthScreen;
