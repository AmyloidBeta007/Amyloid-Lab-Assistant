import React, { useState, useRef } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
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
  Mail,
  Copy,
  Check,
  ExternalLink,
  Globe,
  HardDrive,
  Download,
  Upload,
  UserCheck,
  Plus,
  Shield,
  Zap,
  Edit2
} from 'lucide-react';
import { LocalResearcherProfile } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { signInWithGoogleIdToken } from '../services/authService';

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
  onClearError?: () => void;
  onOpenTroubleshooting?: () => void;
  // Local profile & bypass features
  activeLocalProfile: LocalResearcherProfile;
  localProfiles: LocalResearcherProfile[];
  onSelectLocalProfile: (profileId: string) => void;
  onCreateLocalProfile: (name: string, role: string, email?: string) => void;
  onUpdateActiveProfileName: (name: string, role: string) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
  preferLocalMode: boolean;
  onTogglePreferLocalMode: (prefer: boolean) => void;
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
  onClearError,
  onOpenTroubleshooting,
  activeLocalProfile,
  localProfiles,
  onSelectLocalProfile,
  onCreateLocalProfile,
  onUpdateActiveProfileName,
  onExportBackup,
  onImportBackup,
  preferLocalMode,
  onTogglePreferLocalMode
}) => {
  // Modal view tabs: 'local' (100% free bypass) vs 'cloud' (Firebase Google auth)
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>(() => {
    return currentUser ? 'cloud' : 'local';
  });

  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(activeLocalProfile?.name || 'Lead Researcher');
  const [editRole, setEditRole] = useState(activeLocalProfile?.role || 'Principal Investigator');

  // Auto-switch to cloud tab if an error occurred during Google sign-in
  React.useEffect(() => {
    if (errorMessage && isOpen) {
      setActiveTab('cloud');
    }
  }, [errorMessage, isOpen]);

  // New profile creator state
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState('Research Associate');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const [useCustomAuthDomain, setUseCustomAuthDomain] = useState(() => {
    try {
      return localStorage.getItem('amyloid_use_custom_auth_domain') === 'true';
    } catch {
      return false;
    }
  });

  // Native Google Identity Services (GIS) button initialization
  // Runs Google's official one-tap / sign-in button without opening a popup to gen-lang-client...
  React.useEffect(() => {
    if (!isOpen || activeTab !== 'cloud' || currentUser) return;

    let isMounted = true;
    const initGsi = () => {
      if (!isMounted) return;
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: firebaseConfig.oAuthClientId,
            callback: async (response: any) => {
              if (response?.credential) {
                try {
                  await signInWithGoogleIdToken(response.credential);
                  handleClose();
                } catch (err: any) {
                  console.error('GIS authentication error:', err);
                }
              }
            }
          });

          googleBtnContainerRef.current.innerHTML = '';
          (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'continue_with',
            logo_alignment: 'left',
            width: 320
          });
        } catch (e) {
          console.warn('Could not initialize Google Identity Services button', e);
        }
      }
    };

    // Attempt immediate render or poll until script is loaded
    initGsi();
    const interval = setInterval(initGsi, 600);
    const timeout = setTimeout(() => clearInterval(interval), 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpen, activeTab, currentUser]);

  const handleToggleCustomAuthDomain = (val: boolean) => {
    setUseCustomAuthDomain(val);
    try {
      localStorage.setItem('amyloid_use_custom_auth_domain', val ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not save custom authDomain preference', e);
    }
  };

  if (!isOpen) return null;

  const isUnauthorizedDomain = Boolean(
    errorMessage &&
      (errorMessage.toLowerCase().includes('unauthorized-domain') ||
        errorMessage.toLowerCase().includes('unauthorized domain'))
  );

  const isAccessBlocked = Boolean(
    errorMessage &&
      (errorMessage.toLowerCase().includes('verification process') ||
        errorMessage.toLowerCase().includes('access blocked') ||
        errorMessage.toLowerCase().includes('access_denied'))
  );

  const isRedirectUriMismatch = Boolean(
    errorMessage &&
      (errorMessage.toLowerCase().includes('redirect_uri_mismatch') ||
        errorMessage.toLowerCase().includes('redirect uri') ||
        errorMessage.toLowerCase().includes('invalid request') ||
        errorMessage.toLowerCase().includes('request is invalid') ||
        errorMessage.toLowerCase().includes('400'))
  );

  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
  const gcpCredentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId}`;
  const redirectUriToRegister = `https://${firebaseConfig.authDomain}/__/auth/handler`;

  const handleClose = () => {
    if (onClearError) onClearError();
    onClose();
  };

  const handleCopyCurrentDomain = () => {
    if (currentHost) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleCopyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUriToRegister);
    setCopiedRedirectUri(true);
    setTimeout(() => setCopiedRedirectUri(false), 2500);
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      onUpdateActiveProfileName(editName.trim(), editRole.trim() || 'Researcher');
      setIsEditingProfile(false);
    }
  };

  const handleCreateNewProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      onCreateLocalProfile(newProfileName.trim(), newProfileRole.trim() || 'Researcher');
      setNewProfileName('');
      setShowAddProfileForm(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImportStatus('Restoring workspace backup...');
      await onImportBackup(file);
      setImportStatus('Workspace restored successfully!');
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err: any) {
      setImportStatus(`Restore error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all text-slate-800 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
              style={{ backgroundColor: activeLocalProfile?.color || '#0d9488' }}
            >
              {currentUser
                ? (currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()
                : (activeLocalProfile?.name || 'R')[0].toUpperCase()}
            </div>
            <div>
              <h3 id="account-dialog-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Account &amp; Workspace Storage</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase font-bold">
                  100% Free
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage accounts, switch researchers, or backup your lab data
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs: Local Mode vs Google Cloud */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'local'
                ? 'border-teal-600 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-teal-600" />
            <span>100% Free Local Mode</span>
            <span className="text-[10px] px-1 rounded bg-teal-100 text-teal-800 font-normal">
              No Cloud Fees
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 py-2 px-3 text-xs font-bold rounded-t-lg border-b-2 transition-all ${
              activeTab === 'cloud'
                ? 'border-indigo-600 text-indigo-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Google Account Sync</span>
            {currentUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: 100% FREE LOCAL MODE (NO FIREBASE, NO FEES, NO CREDIT CARDS) */}
          {activeTab === 'local' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Zero Fee Guarantee Box */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold text-emerald-950">
                    Zero Fees Guarantee &amp; Complete Privacy
                  </span>
                </div>
                <p className="text-emerald-900/80 leading-relaxed text-[11px]">
                  All research data, papers, protocols, timers, and brainstorm ideas are stored safely inside your device&apos;s browser storage. You <strong>never</strong> have to pay any fees, never need a credit card, and never need to configure Firebase.
                </p>
              </div>

              {/* Active Local Researcher Profile */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Active Researcher Profile
                  </span>
                  {!isEditingProfile && (
                    <button
                      onClick={() => {
                        setEditName(activeLocalProfile?.name || 'Lead Researcher');
                        setEditRole(activeLocalProfile?.role || 'Principal Investigator');
                        setIsEditingProfile(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit Name/Role</span>
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfileEdit} className="space-y-2 bg-white p-3 rounded-xl border border-teal-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Researcher Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs font-bold text-slate-900 px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-teal-600"
                        placeholder="e.g. Sumaiya Islam"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block">Role / Designation</label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full text-xs text-slate-700 px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-teal-600"
                        placeholder="e.g. Lead Investigator"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-teal-700 text-white rounded-lg text-xs font-bold hover:bg-teal-800"
                      >
                        Save Profile
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0"
                      style={{ backgroundColor: activeLocalProfile?.color || '#0d9488' }}
                    >
                      {(activeLocalProfile?.name || 'R')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {activeLocalProfile?.name || 'Lead Researcher'}
                        </h4>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 shrink-0">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {activeLocalProfile?.role || 'Principal Investigator'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Switch between Local Lab Profiles */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Switch Researcher Profile</span>
                    <button
                      onClick={() => setShowAddProfileForm(!showAddProfileForm)}
                      className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 font-semibold text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add New Profile</span>
                    </button>
                  </div>

                  {/* Add New Profile Form */}
                  {showAddProfileForm && (
                    <form onSubmit={handleCreateNewProfile} className="p-3 bg-white border border-teal-200 rounded-xl space-y-2 animate-in fade-in">
                      <p className="font-bold text-xs text-slate-900">Create Another Lab Member Account</p>
                      <input
                        type="text"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        placeholder="Lab member name (e.g. Dr. Reed, Student A)"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-teal-600"
                        required
                      />
                      <input
                        type="text"
                        value={newProfileRole}
                        onChange={(e) => setNewProfileRole(e.target.value)}
                        placeholder="Role (e.g. Postdoc, Bioinformatician)"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-teal-600"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddProfileForm(false)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
                        >
                          Create &amp; Switch
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Profile list */}
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                    {localProfiles.map((p) => {
                      const isSelected = p.id === activeLocalProfile?.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onSelectLocalProfile(p.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-6 h-6 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0"
                              style={{ backgroundColor: p.color }}
                            >
                              {p.name[0]?.toUpperCase()}
                            </div>
                            <div className="truncate">
                              <span className="text-xs truncate block">{p.name}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">{p.role}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold shrink-0">
                              Selected
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Portable Backup: Transfer between devices without Cloud */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs text-slate-900">
                      Transfer Work Across Devices (No Cloud Needed)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Export all your laboratory papers, protocols, ideas, and timers into a single `.json` file to easily transfer to another computer or phone:
                </p>

                {importStatus && (
                  <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900 font-semibold">
                    {importStatus}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Backup (.json)</span>
                  </button>

                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-xl text-xs shadow-2xs transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restore Backup</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Set as Default button */}
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors text-center"
              >
                Continue Working in Free Local Mode
              </button>
            </div>
          )}

          {/* TAB 2: GOOGLE CLOUD SYNC (OPTIONAL FREE FIREBASE TIER) */}
          {activeTab === 'cloud' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Free Tier Clarification Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-bold text-blue-950">Firebase Spark Plan is 100% Free</span>
                </div>
                <p className="text-blue-900/85 text-[11px] leading-relaxed">
                  Firebase has a free Spark plan with <strong>$0 fees</strong>, requiring <strong>no credit card</strong>. If you decide to use Google cloud sync, it will never charge you.
                </p>
              </div>

              {/* Domain Authorization Fix Card (if unauthorized domain happened) */}
              {isUnauthorizedDomain && (
                <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl text-slate-800 text-xs shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-amber-950 text-sm">Domain Authorization Required</p>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          Firebase $0 Free
                        </span>
                      </div>
                      <p className="text-amber-900/80 mt-1 leading-relaxed">
                        To sign in via Google from your Vercel URL, add your domain to Firebase&apos;s free allowlist for project{' '}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px] font-semibold text-amber-950">
                          {firebaseConfig.projectId}
                        </code>. (Or click below to bypass and stay 100% local!)
                      </p>
                    </div>
                  </div>

                  {/* Hostname with 1-click copy */}
                  <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-mono block">Your Current Domain Hostname:</span>
                      <span className="font-mono font-bold text-xs text-slate-900 select-all truncate block">
                        {currentHost || 'your-domain.vercel.app'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCurrentDomain}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shrink-0 text-xs shadow-xs transition-colors"
                    >
                      {copiedDomain ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Domain</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3 Step Resolution */}
                  <div className="bg-white/90 p-3 rounded-xl border border-amber-200/80 space-y-2 text-slate-700 text-[11px]">
                    <p className="font-bold text-slate-900">30-Second Fix (Completely Free, No Billing):</p>
                    <div className="space-y-1.5 pl-1">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-700 shrink-0">1.</span>
                        <span>
                          Open{' '}
                          <a
                            href={firebaseSettingsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-700 underline font-bold inline-flex items-center gap-0.5 hover:text-teal-900"
                          >
                            Firebase Authentication Settings <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-700 shrink-0">2.</span>
                        <span>
                          Click <strong>&ldquo;Authorized domains&rdquo;</strong> tab, then click <strong>&ldquo;Add domain&rdquo;</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-amber-700 shrink-0">3.</span>
                        <span>
                          Paste <code className="bg-amber-100 px-1 py-0.2 rounded font-mono font-bold text-amber-950">{currentHost}</code> (or <code className="bg-amber-100 px-1 py-0.2 rounded font-mono font-bold text-amber-950">vercel.app</code>) and click <strong>Add</strong>.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('local')}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      Bypass &amp; Use 100% Free Local Mode
                    </button>
                    <a
                      href={firebaseSettingsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <span>Open Firebase</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Error 400: Redirect URI Mismatch Card */}
              {isRedirectUriMismatch && (
                <div className="p-4 bg-rose-50/90 border border-rose-300 rounded-2xl text-slate-800 text-xs shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-rose-100 rounded-lg text-rose-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-rose-950 text-sm">Error 400: redirect_uri_mismatch</p>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                          Google OAuth Policy
                        </span>
                      </div>
                      <p className="text-rose-900/90 mt-1 leading-relaxed">
                        Google blocked this sign-in because the redirect handler URI is missing from your <strong>Authorized redirect URIs</strong> in Google Cloud Console.
                      </p>
                      <p className="text-rose-800/80 text-[11px] mt-0.5 font-medium">
                        (Google Cloud Console-এ &apos;রিডাইরেক্ট URI&apos;-তে এই লিংকটি যোগ করলেই সাথে সাথে ফিক্স হয়ে যাবে)
                      </p>
                    </div>
                  </div>

                  {/* Required Redirect URI with 1-click copy */}
                  <div className="p-2.5 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-mono block">Required Redirect URI to Add:</span>
                      <span className="font-mono font-bold text-xs text-rose-950 select-all truncate block">
                        {redirectUriToRegister}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRedirectUri}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg shrink-0 text-xs shadow-xs transition-colors"
                    >
                      {copiedRedirectUri ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 30-Second Fix Steps */}
                  <div className="bg-white/95 p-3 rounded-xl border border-rose-200/80 space-y-2 text-slate-700 text-[11px]">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">30-Second Fix in Google Cloud Console:</p>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">100% Free</span>
                    </div>
                    <div className="space-y-1.5 pl-1">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-rose-700 shrink-0">1.</span>
                        <span>
                          Open{' '}
                          <a
                            href={gcpCredentialsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-700 underline font-bold inline-flex items-center gap-0.5 hover:text-rose-900"
                          >
                            Google Cloud Credentials ({firebaseConfig.projectId}) <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-rose-700 shrink-0">2.</span>
                        <span>
                          Under <strong>OAuth 2.0 Client IDs</strong>, click your <strong>Web client</strong> (starts with <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[10px]">{firebaseConfig.oAuthClientId.slice(0, 16)}...</code>).
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-rose-700 shrink-0">3.</span>
                        <span>
                          Scroll down to <strong>Authorized redirect URIs</strong> (অনুমোদিত রিডাইরেক্ট ইউআরআই) &rarr; Click <strong>+ ADD URI</strong>.
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-rose-700 shrink-0">4.</span>
                        <span>
                          Paste <code className="bg-rose-100 px-1 py-0.2 rounded font-mono font-bold text-rose-950">{redirectUriToRegister}</code> and click <strong>SAVE</strong> at the bottom.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveTab('local')}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Bypass: Use 100% Free Local Mode</span>
                    </button>
                    <a
                      href={gcpCredentialsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <span>Open Credentials Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Other error notices */}
              {!isUnauthorizedDomain && !isRedirectUriMismatch && errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Authentication Notice</p>
                    <p className="mt-0.5">{errorMessage}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('local')}
                      className="mt-1 text-teal-800 underline font-bold block"
                    >
                      Bypass this error: switch to 100% Free Local Mode
                    </button>
                  </div>
                </div>
              )}

              {currentUser ? (
                /* Google Logged in state */
                <div className="space-y-4">
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
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate mt-0.5">{currentUser.email}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        UID: {currentUser.uid.slice(0, 14)}...
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <span className="font-semibold text-emerald-950 block">Cloud Auto-Save Active</span>
                        <span className="text-emerald-700 text-[11px]">
                          {lastSavedTime ? `Last saved: ${lastSavedTime}` : 'All work saved to your account'}
                        </span>
                      </div>
                    </div>
                    <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={async () => {
                        await onSwitchAccount();
                      }}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all font-medium text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-teal-700" />
                        <div className="text-left">
                          <span className="font-bold block">Switch Google Account</span>
                          <span className="text-slate-500 text-[11px]">Select another Google identity</span>
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

                    <button
                      onClick={async () => {
                        await onSignOut();
                        setActiveTab('local');
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-all font-medium text-xs shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <div className="text-left">
                          <span className="font-bold block">Disconnect Google Account</span>
                          <span className="text-slate-400 text-[11px]">Revert to Free Local Mode</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400">Exit</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Google Logged out state */
                <>
/* Google Logged out state */
<div className="space-y-4">
<p className="text-xs text-slate-600 leading-relaxed">
Optional: Connect your Google account to automatically sync your laboratory research to Google Cloud Firestore (Spark Tier: $0/month).
</p>

<div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
<div className="flex items-center gap-1.5 font-bold text-slate-800">
<Shield className="w-3.5 h-3.5 text-teal-600 shrink-0" />
<span>Privacy &amp; Security Note for Collaborators</span>
</div>
<p>
Signing in only verifies your basic identity (name &amp; email). It <strong>never</strong> accesses personal files, Google Drive, or private emails.
</p>
</div>

{/* Option 1: Native Google Identity Services Button (Embedded directly on page, No Firebase Popup URL) */}
<div className="space-y-2 pt-1">
<div className="flex justify-center">
<div ref={googleBtnContainerRef} className="min-h-[44px] flex items-center justify-center" />
</div>

<div className="flex items-center gap-2 w-full my-1">
<div className="flex-1 h-px bg-slate-200" />
<span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">or sign in with popup</span>
<div className="flex-1 h-px bg-slate-200" />
</div>

<button
type="button"
onClick={async () => {
await onSignIn();
} }
disabled={isSigningIn}
className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
>
{isSigningIn? (
<>
<RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
<span>Connecting to Google...</span>
</>
):(
<>
<div className="w-5 h-5 bg-white rounded p-0.5 flex items-center justify-center shrink-0">
<svg className="w-full h-full" viewBox="0 0 24 24">
<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
</svg>
</div>
<span>Sign In with Google Popup</span>
</>
)}
<button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Sign In with Google Popup</span>
          </button>
        </div>
      </div>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('local')}
          className="text-xs text-teal-700 hover:text-teal-900 font-semibold underline flex items-center justify-center gap-1 mx-auto"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Hesitant users? Switch to 100% Free Local Mode (No login required)</span>
        </button>
      </div>

      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Zero Fees • 100% Client-Side Ready</span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="font-medium text-slate-600 hover:text-slate-900"
        >
          Close
        </button>
      </div>
    </div>
  );
};