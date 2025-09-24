import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { UserProfile, UserRole } from './types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface SignInPayload {
    email: string;
    password: string;
}

interface SignUpPayload extends SignInPayload {
    fullName?: string;
}

interface AuthContextValue {
    status: AuthStatus;
    isLoading: boolean;
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    error: string | null;
    signIn: (payload: SignInPayload) => Promise<void>;
    signUp: (payload: SignUpPayload) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    clearError: () => void;
    listProfiles: () => Promise<UserProfile[]>;
    updateUserRole: (userId: string, role: UserRole) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapProfileRow = (row: any): UserProfile => ({
    id: row.id,
    email: row.email ?? null,
    role: row.role ?? 'user',
    fullName: row.full_name ?? row.fullName ?? null,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
});

const fetchOrCreateProfile = async (user: User): Promise<UserProfile> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (data) {
        return mapProfileRow(data);
    }

    const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
            id: user.id,
            email: user.email ?? null,
            role: 'user',
            full_name: user.user_metadata?.full_name ?? user.email ?? null,
        })
        .select()
        .single();

    if (insertError) {
        throw insertError;
    }

    return mapProfileRow(inserted);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const initialise = async () => {
            const { data, error: sessionError } = await supabase.auth.getSession();
            if (!isMounted) return;
            if (sessionError) {
                setError(sessionError.message);
                setStatus('unauthenticated');
                return;
            }
            setSession(data.session);
            setStatus(data.session ? 'authenticated' : 'unauthenticated');
        };
        void initialise();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            if (!isMounted) return;
            setSession(nextSession);
            setStatus(nextSession ? 'authenticated' : 'unauthenticated');
        });

        return () => {
            isMounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    const loadProfile = useCallback(async (user: User | null) => {
        if (!user) {
            setProfile(null);
            return;
        }
        setProfileLoading(true);
        try {
            const resolved = await fetchOrCreateProfile(user);
            setProfile(resolved);
            setError(null);
        } catch (profileError: any) {
            console.error('Failed to load profile', profileError);
            setError(profileError.message ?? 'Failed to load profile');
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProfile(session?.user ?? null);
    }, [loadProfile, session?.user]);

    const signIn = useCallback(async ({ email, password }: SignInPayload) => {
        setError(null);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(signInError.message);
            throw signInError;
        }
    }, []);

    const signUp = useCallback(async ({ email, password, fullName }: SignUpPayload) => {
        setError(null);
        const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
                data: {
                    full_name: fullName ?? email,
                },
            },
        });
        if (signUpError) {
            setError(signUpError.message);
            throw signUpError;
        }
        if (data.session?.user) {
            await loadProfile(data.session.user);
        }
    }, [loadProfile]);

    const signOut = useCallback(async () => {
        setError(null);
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            setError(signOutError.message);
            throw signOutError;
        }
    }, []);

    const ensureAdmin = useCallback(() => {
        if (profile?.role !== 'admin') {
            const message = 'Administrator permissions required.';
            setError(message);
            throw new Error(message);
        }
    }, [profile?.role]);

    const listProfiles = useCallback(async (): Promise<UserProfile[]> => {
        ensureAdmin();
        const { data, error: listError } = await supabase
            .from('profiles')
            .select('id, email, role, full_name, created_at, updated_at')
            .order('created_at', { ascending: true });

        if (listError) {
            throw listError;
        }

        return (data ?? []).map(mapProfileRow);
    }, [ensureAdmin]);

    const updateUserRole = useCallback(async (userId: string, role: UserRole): Promise<UserProfile> => {
        ensureAdmin();
        const { data, error: updateError } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId)
            .select('id, email, role, full_name, created_at, updated_at')
            .single();

        if (updateError) {
            throw updateError;
        }

        return mapProfileRow(data);
    }, [ensureAdmin]);

    const value = useMemo<AuthContextValue>(() => ({
        status,
        isLoading: status === 'loading' || profileLoading,
        session,
        user: session?.user ?? null,
        profile,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile: () => loadProfile(session?.user ?? null),
        clearError: () => setError(null),
        listProfiles,
        updateUserRole,
    }), [error, listProfiles, loadProfile, profile, profileLoading, session, signIn, signOut, signUp, status, updateUserRole]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
