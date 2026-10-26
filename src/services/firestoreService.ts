import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { app } from './authService';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ResearchPaper,
  Protocol,
  TargetOutcomeRecord,
  DiscardedItem,
  BioinformaticsPipelineRun,
  ActionItem,
  MoodLogEntry,
  LabSlotBooking
} from '../types';

export interface GeneratedIdeaDraft {
  id: string;
  title: string;
  content: string;
  model: string;
  mode: string;
  createdAt: string;
  exportedDoc?: any;
  gmailResult?: any;
}

export interface WorkspaceDataPayload {
  papers: ResearchPaper[];
  protocols: Protocol[];
  targetOutcomes: TargetOutcomeRecord[];
  discardedItems: DiscardedItem[];
  pipelineRuns: BioinformaticsPipelineRun[];
  actionItems: ActionItem[];
  moodLogs: MoodLogEntry[];
  slots: LabSlotBooking[];
  brainstormIdeas: GeneratedIdeaDraft[];
  lastSavedAt: string;
  savedByEmail?: string;
}

const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, firestoreDbId);

// Test Firestore connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_probe'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firestore] Client appears offline or initial probe pending.');
    }
  }
})();

const getLocalKey = (userId: string) => `amyloid_lab_workspace_${userId}`;

/**
 * Save user profile info to Firestore
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!user) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Researcher',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Could not sync user profile to cloud (local fallback will remain active):', err);
  }
}

/**
 * Save user research workspace to Firestore + LocalStorage
 */
export async function saveUserWorkspace(
  userId: string,
  payload: WorkspaceDataPayload
): Promise<{ success: boolean; cloudSynced: boolean; timestamp: string }> {
  const timestamp = new Date().toISOString();
  const enrichedPayload: WorkspaceDataPayload = {
    ...payload,
    lastSavedAt: timestamp
  };

  // 1. Always save immediately to user-scoped localStorage
  try {
    localStorage.setItem(getLocalKey(userId), JSON.stringify(enrichedPayload));
  } catch (err) {
    console.error('[Storage] Error writing to local backup:', err);
  }

  // 2. Sync to Firestore in the cloud
  let cloudSynced = false;
  try {
    const workspaceDocRef = doc(db, 'users', userId, 'workspace', 'current');
    await setDoc(workspaceDocRef, enrichedPayload, { merge: true });
    cloudSynced = true;
  } catch (err) {
    console.warn('[Firestore] Cloud sync paused, saved locally:', err);
  }

  return { success: true, cloudSynced, timestamp };
}

/**
 * Load user research workspace from Firestore or LocalStorage
 */
export async function loadUserWorkspace(userId: string): Promise<WorkspaceDataPayload | null> {
  // 1. Try fetching freshest copy from cloud Firestore
  try {
    const workspaceDocRef = doc(db, 'users', userId, 'workspace', 'current');
    const snapshot = await getDoc(workspaceDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as WorkspaceDataPayload;
      localStorage.setItem(getLocalKey(userId), JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[Firestore] Could not load from cloud, reading local cache:', err);
  }

  // 2. Fallback to user-scoped local storage
  try {
    const cached = localStorage.getItem(getLocalKey(userId));
    if (cached) {
      return JSON.parse(cached) as WorkspaceDataPayload;
    }
  } catch (err) {
    console.error('[Storage] Error reading local cache:', err);
  }

  return null;
}

/**
 * Restart/Purge all brainstorm ideas for a user:
 * Deletes ideas and resets idea draft history
 */
export async function restartUserBrainstormIdeas(userId?: string): Promise<void> {
  if (userId) {
    try {
      const cached = localStorage.getItem(getLocalKey(userId));
      if (cached) {
        const parsed = JSON.parse(cached) as WorkspaceDataPayload;
        parsed.brainstormIdeas = [];
        parsed.lastSavedAt = new Date().toISOString();
        localStorage.setItem(getLocalKey(userId), JSON.stringify(parsed));

        const workspaceDocRef = doc(db, 'users', userId, 'workspace', 'current');
        await setDoc(workspaceDocRef, { brainstormIdeas: [] }, { merge: true });
      }
    } catch (err) {
      console.warn('[Storage] Error restarting user brainstorm ideas:', err);
    }
  }

  // Also clear legacy unauthenticated brainstorm cache if any
  try {
    localStorage.removeItem('amyloid_brainstorm_ideas');
  } catch (err) {
    // Ignore
  }
}
