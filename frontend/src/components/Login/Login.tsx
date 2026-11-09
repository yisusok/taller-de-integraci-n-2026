import { useAuth0 } from '@auth0/auth0-react';

export const LoginButton = () => {
  const { loginWithRedirect, logout, isAuthenticated, user, isLoading } = useAuth0();

  if (isLoading) {
    return <button disabled>Cargando...</button>;
  }

  if (isAuthenticated && user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>
          {user.email}
        </span>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => loginWithRedirect()}>
      Login con Auth0
    </button>
  );
};

