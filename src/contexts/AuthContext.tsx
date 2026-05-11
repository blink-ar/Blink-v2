import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (email: string) => void;
  loginWithPasskey: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const CALLBACK_URL = `${window.location.origin}/auth/callback`;
const LOGOUT_URL = window.location.origin;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: auth0User, isLoading, isAuthenticated, loginWithRedirect, logout: auth0Logout } = useAuth0();

  const user: AuthUser | null = auth0User ? {
        id: auth0User.sub ?? '',
        name: auth0User.name ?? auth0User.email ?? '',
        email: auth0User.email ?? '',
        picture: auth0User.picture,
      }
    : null;

  const loginWithGoogle = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
        redirect_uri: CALLBACK_URL,
      },
    });
  }, [loginWithRedirect]);

  const loginWithEmail = useCallback((email: string) => {
    loginWithRedirect({
      authorizationParams: {
        connection: 'email',
        login_hint: email,
        send: 'code',
        redirect_uri: CALLBACK_URL,
      },
    });
  }, [loginWithRedirect]);

  const loginWithPasskey = useCallback(() => {
    loginWithRedirect({
      authorizationParams: {
        redirect_uri: CALLBACK_URL,
      },
    });
  }, [loginWithRedirect]);

  const logout = useCallback(() => {
    auth0Logout({ logoutParams: { returnTo: LOGOUT_URL } });
  }, [auth0Logout]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, loginWithGoogle, loginWithEmail, loginWithPasskey, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
