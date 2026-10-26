import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Desired Google Workspace Scopes (Google Docs, Google Drive files, Gmail sending & drafting)
// Note: These are requested ON-DEMAND when using Docs/Gmail features, NOT during initial account login,
// so that login and workspace cloud saving are never blocked by Google OAuth verification.
export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose'
];

export const SCOPES = WORKSPACE_SCOPES;

// In-memory token storage (NEVER stored in localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedWorkspaceToken: string | null = null;

export interface AuthErrorInfo {
  code: string;
  message: string;
  isUnauthorizedDomain: boolean;
  isAccessBlockedOrVerification: boolean;
  isPopupClosed: boolean;
  currentDomain: string;
}

export function parseAuthError(error: any): AuthErrorInfo {
  const msg = error?.message || String(error || '');
  const code = error?.code || '';

  const isUnauthorizedDomain =
    code === 'auth/unauthorized-domain' ||
    msg.toLowerCase().includes('unauthorized-domain') ||
    msg.toLowerCase().includes('unauthorized domain');

  const isAccessBlockedOrVerification =
    msg.toLowerCase().includes('verification process') ||
    msg.toLowerCase().includes('has not completed the google verification') ||
    msg.toLowerCase().includes('access_denied') ||
    msg.toLowerCase().includes('access blocked') ||
    code === 'auth/access-denied';

  const isPopupClosed =
    code === 'auth/popup-closed-by-user' ||
    msg.toLowerCase().includes('popup-closed-by-user') ||
    msg.toLowerCase().includes('closed by user');

  return {
    code,
    message: msg,
    isUnauthorizedDomain,
    isAccessBlockedOrVerification,
    isPopupClosed,
    currentDomain: typeof window !== 'undefined' ? window.location.hostname : ''
  };
}

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not in memory (page reload), user needs to sign in to obtain new access token
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedWorkspaceToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Standard Google Sign-In:
 * Uses basic Google identity scopes (openid, profile, email) to authenticate the researcher.
 * This NEVER triggers "Access blocked: unverified app" and allows ANY user (including university
 * and organizational accounts like @g.bracu.ac.bd) to log in instantly and save their work to Firestore.
 */
export const googleSignIn = async (promptType: 'consent' | 'select_account' = 'select_account'): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: promptType
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Switch Google Account:
 * Signs out current user and invokes Google Sign-In with prompt: 'select_account'
 * so Google renders the account chooser allowing user to select another account.
 * Also uses standard identity scopes so it is never blocked.
 */
export const switchGoogleAccount = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    await signOut(auth);
    cachedAccessToken = null;
    cachedWorkspaceToken = null;

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Switch Account error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Incremental / On-Demand Workspace Authorization:
 * Requests Google Docs and Gmail scopes specifically when the user chooses to invoke
 * Google Docs export or direct Gmail dispatch.
 */
export const requestWorkspaceScopes = async (): Promise<string | null> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'consent'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      cachedWorkspaceToken = credential.accessToken;
    }
    return cachedWorkspaceToken || cachedAccessToken;
  } catch (error: any) {
    console.error('Workspace scope authorization error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getWorkspaceAccessToken = async (): Promise<string | null> => {
  return cachedWorkspaceToken || cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedWorkspaceToken = null;
};

