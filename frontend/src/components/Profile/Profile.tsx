import { useAuth0 } from "@auth0/auth0-react";

export const Profile = () => {
    const { user, isAuthenticated, isLoading } = useAuth0();
    if (isLoading) {
        return <div>Cargando...</div>;
    }
    if (!isAuthenticated || !user) {
        return null;
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user.picture && (
                <img
                    src={user.picture}
                    alt={user.name || 'Usuario'}
                    style={{ width: 36, height: 36, borderRadius: '50%' }}
                />
            )}
            <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.email}</div>
            </div>
        </div>
    );
};