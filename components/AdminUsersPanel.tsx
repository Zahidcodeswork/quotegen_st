import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CLIENT_LOGO_PATH } from '../app/constants';
import { useAuth } from '../app/authContext';
import { UserProfile, UserRole } from '../app/types';

const roleOptions: UserRole[] = ['user', 'admin'];

interface AdminUsersPanelProps {
    onBack: () => void;
}

const AdminUsersPanel: React.FC<AdminUsersPanelProps> = ({ onBack }) => {
    const { profile, listProfiles, updateUserRole, clearError, error } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyUserId, setBusyUserId] = useState<string | null>(null);

    const isAdmin = profile?.role === 'admin';

    const loadUsers = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        setActionError(null);
        clearError();
        try {
            const data = await listProfiles();
            setUsers(data);
        } catch (loadError: any) {
            setActionError(loadError?.message ?? 'Unable to load users.');
        } finally {
            setLoading(false);
        }
    }, [clearError, isAdmin, listProfiles]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const handleRoleChange = async (userId: string, role: UserRole) => {
        setBusyUserId(userId);
        setActionError(null);
        clearError();
        try {
            const updated = await updateUserRole(userId, role);
            setUsers(prev => prev.map(userProfile => (userProfile.id === updated.id ? updated : userProfile)));
        } catch (roleError: any) {
            setActionError(roleError?.message ?? 'Unable to update role.');
        } finally {
            setBusyUserId(null);
        }
    };

    const combinedError = useMemo(() => actionError || error, [actionError, error]);

    return (
        <div className="app-container">
            <header>
                <div className="header-brand">
                    <img src={CLIENT_LOGO_PATH} alt="Client brand logo" className="brand-logo" />
                    <div>
                        <h1>User Management</h1>
                        <p className="text-muted">Invite teammates, elevate admins, and review account access.</p>
                    </div>
                </div>
                <div className="dashboard-actions">
                    <button className="btn btn-secondary" onClick={() => { void loadUsers(); }} disabled={loading}>
                        {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                    <button className="btn btn-secondary" onClick={onBack}>Back to Dashboard</button>
                </div>
            </header>
            <div className="dashboard-container">
                {!isAdmin ? (
                    <div className="empty-dashboard">
                        <p>You need administrator access to view this area.</p>
                    </div>
                ) : (
                    <>
                        {combinedError && (
                            <div className="form-error-block" role="alert" style={{ marginBottom: '1rem' }}>
                                {combinedError}
                            </div>
                        )}
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem 0' }}>Loading users…</td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem 0' }}>No users found yet.</td>
                                    </tr>
                                ) : (
                                    users.map(userProfile => (
                                        <tr key={userProfile.id}>
                                            <td>{userProfile.fullName || '—'}</td>
                                            <td>{userProfile.email || '—'}</td>
                                            <td>
                                                <select
                                                    value={userProfile.role}
                                                    onChange={event => handleRoleChange(userProfile.id, event.target.value as UserRole)}
                                                    disabled={busyUserId === userProfile.id}
                                                >
                                                    {roleOptions.map(option => (
                                                        <option key={option} value={option}>{option === 'admin' ? 'Admin' : 'User'}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>{userProfile.createdAt ? new Date(userProfile.createdAt).toLocaleString() : '—'}</td>
                                            <td>{userProfile.updatedAt ? new Date(userProfile.updatedAt).toLocaleString() : '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPanel;
