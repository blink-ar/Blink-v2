import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react';
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
  loginWithGoogle: () => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  initiateEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
const TOKEN_KEY = 'blink_id_token';
const LOGOUT_URL = window.location.origin;
const CALLBACK_URL = `${window.location.origin}/auth/callback`;

function decodeJwtPayload(token: string) {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(b64)) as {
    sub: string; name?: string; email?: string; picture?: string; exp: number;
  };
}

function tokenToUser(idToken: string): AuthUser {
  const p = decodeJwtPayload(idToken);
  return { id: p.sub, name: p.name ?? p.email ?? '', email: p.email ?? '', picture: p.picture };
}

function isExpired(idToken: string): boolean {
  try { return decodeJwtPayload(idToken).exp * 1000 < Date.now(); } catch { return true; }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user: auth0User,
    isLoading: sdkLoading,
    isAuthenticated: sdkAuth,
    loginWithPopup,
    logout: auth0Logout,
  } = useAuth0();

  const [otpUser, setOtpUser] = useState<AuthUser | null>(null);
  const [otpLoading, setOtpLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && !isExpired(token)) {
      try { setOtpUser(tokenToUser(token)); } catch { localStorage.removeItem(TOKEN_KEY); }
    } else if (token) {
      localStorage.removeItem(TOKEN_KEY);
    }
    setOtpLoading(false);
  }, []);

  const sdkMappedUser: AuthUser | null = auth0User
    ? { id: auth0User.sub ?? '', name: auth0User.name ?? auth0User.email ?? '', email: auth0User.email ?? '', picture: auth0User.picture }
    : null;

  const user = sdkMappedUser ?? otpUser;
  const isLoading = sdkLoading || otpLoading;
  const isAuthenticated = sdkAuth || otpUser !== null;

  const loginWithGoogle = useCallback(async () => {
    await loginWithPopup({ authorizationParams: { connection: 'google-oauth2', redirect_uri: CALLBACK_URL } });
  }, [loginWithPopup]);

  const loginWithPasskey = useCallback(async () => {
    await loginWithPopup({ authorizationParams: { redirect_uri: CALLBACK_URL } });
  }, [loginWithPopup]);

  const initiateEmailOTP = useCallback(async (email: string) => {
    const res = await fetch(`https://${AUTH0_DOMAIN}/passwordless/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: AUTH0_CLIENT_ID, connection: 'email', email, send: 'code' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error_description?: string };
      throw new Error(err.error_description ?? 'No se pudo enviar el código');
    }
  }, []);

  const verifyEmailOTP = useCallback(async (email: string, otp: string) => {
    const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'http://auth0.com/oauth/grant-type/passwordless/otp',
        client_id: AUTH0_CLIENT_ID,
        username: email,
        otp,
        realm: 'email',
        scope: 'openid profile email',
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error_description?: string };
      throw new Error(err.error_description ?? 'Código incorrecto');
    }
    const data = await res.json() as { id_token: string };
    localStorage.setItem(TOKEN_KEY, data.id_token);
    setOtpUser(tokenToUser(data.id_token));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setOtpUser(null);
    if (sdkAuth) {
      auth0Logout({ logoutParams: { returnTo: LOGOUT_URL } });
    }
  }, [auth0Logout, sdkAuth]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, loginWithGoogle, loginWithPasskey, initiateEmailOTP, verifyEmailOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
