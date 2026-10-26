import React from 'react';
import {
  User as FirebaseUser
} from 'firebase/auth';
import {
  Users,
  ShieldCheck,
  Cloud,
  LogOut,
  RefreshCw,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Mail
} from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onSignIn: () => Promise<void>;
  onSwitchAccount: () => Promise<void>;
  onSignOut: () => Promise<void>;
  isSigningIn: boolean;
  lastSavedTime: string | null;
  cloudSynced: boolean;
  errorMessage?: string | null;
  onOpenTroubleshooting?: () => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSignIn,
  onSwitchAccount,
  onSignOut,
  isSigningIn,
  lastSavedTime,
  cloudSynced,
  errorMessage,
  onOpenTroubleshooting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-account-dialog-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-2 shrink-0">
              {/* Google colored G logo */}
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 id="google-account-dialog-title" className="text-base font-bold text-slate-900">
                {currentUser ? 'Your Google Account' : 'Sign In with Google'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser ? 'Account & Cloud Sync Settings' : 'Create an account to save your lab research'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notice if present */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Authentication Notice</p>
              <p className="mt-0.5">{errorMessage}</p>
              {onOpenTroubleshooting && (
                <button
                  onClick={onOpenTroubleshooting}
                  className="mt-1 text-teal-700 underline font-semibold hover:text-teal-900 block"
                >
                  View OAuth & domain troubleshooting guide
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-4">
          {currentUser ? (
            /* Logged in state */
            <div className="space-y-4">
              {/* Account card */}
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User Avatar'}
                    className="w-12 h-12 rounded-full ring-2 ring-teal-500/30 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                    {(currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {currentUser.displayName || 'Researcher'}
                    </h4>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{currentUser.email}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    UID: {currentUser.uid.slice(0, 14)}...
                  </p>
                </div>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <span className="font-semibold text-emerald-950 block">Cloud Auto-Save Enabled</span>
                    <span className="text-emerald-700 text-[11px]">
                      {lastSavedTime ? `Last saved: ${lastSavedTime}` : 'All work saved to your account'}
                    </span>
                  </div>
                </div>
                <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
              </div>

              {/* Actions Grid */}
              <div className="space-y-2 pt-1">
                {/* Switch Account button */}
                <button
                  onClick={async () => {
                    await onSwitchAccount();
                  }}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-300 text-slate-800 transition-all font-medium text-xs shadow-sm group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-slate-900 block">Switch Account</span>
                      <span className="text-slate-500 text-[11px]">
                        Log in with a different Google account
                      </span>
                    </div>
                  </div>
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
                  ) : (
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded">
                      Switch
                    </span>
                  )}
                </button>

                {/* Sign Out button */}
                <button
                  onClick={async () => {
                    await onSignOut();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-rose-50/50 hover:border-rose-200 text-slate-700 hover:text-rose-700 transition-all font-medium text-xs shadow-sm group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-rose-100 group-hover:text-rose-700 text-slate-600 transition-colors">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <span className="font-bold block">Sign Out</span>
                      <span className="text-slate-400 text-[11px]">End active research session</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 group-hover:text-rose-600 font-medium">
                    Exit
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged out state */
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your Google account to create your personal research profile. Every piece of work you create—papers, protocols, hypotheses, bench timers, and ideas—is automatically saved to your private account.
              </p>

              {/* Value props */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg bg-slate-50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Automatic Cloud Save:</strong> Work safely preserved across devices</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg bg-slate-50">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>Switch Accounts:</strong> Toggle seamlessly between lab members</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg bg-slate-50">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>1-Click Google Docs:</strong> Direct academic draft export</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 p-2 rounded-lg bg-slate-50">
                  <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                  <span><strong>Gmail Integration:</strong> Dispatch lab updates to collaborators</span>
                </div>
              </div>

              {/* Sign in with Google Button */}
              <button
                onClick={async () => {
                  await onSignIn();
                }}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                {isSigningIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <div className="w-5 h-5 bg-white rounded p-0.5 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    </div>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Secure OAuth 2.0 & Firebase Auth</span>
          </div>
          <button
            onClick={onClose}
            className="font-medium text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
