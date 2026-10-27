import { LocalResearcherProfile, WorkspaceBackupPayload } from '../types';

const PROFILES_STORAGE_KEY = 'amyloid_local_profiles';
const ACTIVE_PROFILE_KEY = 'amyloid_active_profile_id';
const LOCAL_MODE_PREF_KEY = 'amyloid_prefer_local_mode';

export const DEFAULT_PROFILES: LocalResearcherProfile[] = [
  {
    id: 'profile-primary',
    name: 'Lead Researcher',
    email: 'researcher@lab.local',
    role: 'Principal Investigator',
    color: '#0d9488', // Teal
    createdAt: new Date().toISOString()
  },
  {
    id: 'profile-collaborator',
    name: 'Postdoc Collaborator',
    email: 'collaborator@lab.local',
    role: 'Postdoctoral Fellow',
    color: '#4f46e5', // Indigo
    createdAt: new Date().toISOString()
  }
];

export function getLocalProfiles(): LocalResearcherProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveLocalProfiles(profiles: LocalResearcherProfile[]): void {
  try {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.warn('Failed to save local profiles to localStorage:', err);
  }
}

export function getActiveLocalProfileId(): string {
  try {
    const active = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (active) return active;
    const profiles = getLocalProfiles();
    const fallbackId = profiles[0]?.id || 'profile-primary';
    localStorage.setItem(ACTIVE_PROFILE_KEY, fallbackId);
    return fallbackId;
  } catch {
    return 'profile-primary';
  }
}

export function setActiveLocalProfileId(profileId: string): void {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
  } catch (err) {
    console.warn('Failed to set active profile id:', err);
  }
}

export function getActiveLocalProfile(): LocalResearcherProfile {
  const profiles = getLocalProfiles();
  const activeId = getActiveLocalProfileId();
  return profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILES[0];
}

export function isLocalModePreferred(): boolean {
  try {
    return localStorage.getItem(LOCAL_MODE_PREF_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setLocalModePreferred(preferred: boolean): void {
  try {
    localStorage.setItem(LOCAL_MODE_PREF_KEY, preferred ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to set local mode preference:', err);
  }
}

/**
 * 1-Click Export: Downloads entire workspace as a portable JSON file.
 * Allows instant transfer across devices, browsers, or offline backups with ZERO cloud fees.
 */
export function exportWorkspaceToJsonFile(payload: Omit<WorkspaceBackupPayload, 'version' | 'exportedAt'>): void {
  const backup: WorkspaceBackupPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    ...payload
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStamp = new Date().toISOString().split('T')[0];
  anchor.href = url;
  anchor.download = `amyloid_lab_workspace_backup_${dateStamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * 1-Click Import: Parses a uploaded JSON backup file and returns the validated payload.
 */
export function parseWorkspaceBackupFile(file: File): Promise<WorkspaceBackupPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as WorkspaceBackupPayload;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid JSON file.');
        }
        resolve(data);
      } catch (err: any) {
        reject(new Error(`Failed to parse workspace backup: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsText(file);
  });
}
