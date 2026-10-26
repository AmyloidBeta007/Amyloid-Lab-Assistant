import React, { useState, useEffect } from 'react';
import {
  ResearchPaper, Protocol, TargetOutcomeRecord, LabTimer,
  LabSlotBooking, MoodLogEntry, ActionItem, ProtocolReagent,
  DiscardedItem, BioinformaticsPipelineRun, DiscardType
} from './types';
import {
  SEED_PAPERS, SEED_PROTOCOLS, SEED_TARGET_OUTCOMES,
  SEED_LAB_SLOTS, SEED_MOOD_LOGS, SEED_ACTION_ITEMS,
  SEED_DISCARDED_ITEMS, SEED_BIOINFORMATICS_RUNS
} from './data/seedData';
import { TopNav, NavTab, LabTheme } from './components/TopNav';
import { PaperSynthesizer } from './components/PaperSynthesizer';
import { TargetOutcomesMatrix } from './components/TargetOutcomesMatrix';
import { ProtocolBuilder } from './components/ProtocolBuilder';
import { BioinformaticsStudio } from './components/BioinformaticsStudio';
import { DiscardMemoryVault } from './components/DiscardMemoryVault';
import { BenchTimersAndSlots } from './components/BenchTimersAndSlots';
import { MoodEnergyTracker } from './components/MoodEnergyTracker';
import { WhatToDoNext } from './components/WhatToDoNext';
import { ReagentCalculatorModal } from './components/ReagentCalculatorModal';
import { AIWritingBrainstormStudio } from './components/AIWritingBrainstormStudio';
import { labAudio } from './utils/audioAlert';
import { RotateCcw, Cloud, Users, Sparkles, ShieldCheck, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { subscribeToAuth, googleSignIn, switchGoogleAccount, logout } from './services/authService';
import {
  saveUserWorkspace,
  loadUserWorkspace,
  syncUserProfile,
  restartUserBrainstormIdeas,
  GeneratedIdeaDraft
} from './services/firestoreService';
import { GoogleAccountModal } from './components/GoogleAccountModal';
import { RestartConfirmModal } from './components/RestartConfirmModal';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('papers');

  // Display Theme & Brightness (white, sepia (eye soothing), black, pink, brightness)
  const [theme, setTheme] = useState<LabTheme>(() => {
    const saved = localStorage.getItem('amyloid_lab_theme');
    return (saved as LabTheme) || 'white';
  });
  const [brightness, setBrightness] = useState<number>(() => {
    const saved = localStorage.getItem('amyloid_lab_brightness');
    return saved ? Number(saved) : 100;
  });

  useEffect(() => {
    localStorage.setItem('amyloid_lab_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('amyloid_lab_brightness', brightness.toString());
  }, [brightness]);

  // Persistence State: Papers
  const [papers, setPapers] = useState<ResearchPaper[]>(() => {
    const saved = localStorage.getItem('biosynth_papers');
    return saved ? JSON.parse(saved) : SEED_PAPERS;
  });
  const [selectedPaperId, setSelectedPaperId] = useState<string>(papers[0]?.id || 'paper-jinek-2012');

  // Persistence State: Protocols
  const [protocols, setProtocols] = useState<Protocol[]>(() => {
    const saved = localStorage.getItem('biosynth_protocols');
    return saved ? JSON.parse(saved) : SEED_PROTOCOLS;
  });
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>(protocols[0]?.id || 'proto-rna-trizol');

  // Persistence State: Targets and Empirical Outcomes
  const [targetOutcomes, setTargetOutcomes] = useState<TargetOutcomeRecord[]>(() => {
    const saved = localStorage.getItem('biosynth_target_outcomes');
    return saved ? JSON.parse(saved) : SEED_TARGET_OUTCOMES;
  });

  // Persistence State: Discarded Items (Wet Discard quarantine + Dry Discard memory vault)
  const [discardedItems, setDiscardedItems] = useState<DiscardedItem[]>(() => {
    const saved = localStorage.getItem('biosynth_discarded');
    return saved ? JSON.parse(saved) : SEED_DISCARDED_ITEMS;
  });

  // Persistence State: Bioinformatics Pipeline Runs
  const [pipelineRuns, setPipelineRuns] = useState<BioinformaticsPipelineRun[]>(() => {
    const saved = localStorage.getItem('biosynth_pipeline_runs');
    return saved ? JSON.parse(saved) : SEED_BIOINFORMATICS_RUNS;
  });

  // Timers
  const [timers, setTimers] = useState<LabTimer[]>([
    {
      id: 'timer-1',
      name: 'Cold Centrifugation (Phase Partition)',
      durationSeconds: 900,
      remainingSeconds: 642,
      isRunning: true,
      isPaused: false,
      type: 'centrifuge',
      protocolStepTitle: 'Cold Centrifugation for Phase Partitioning'
    },
    {
      id: 'timer-2',
      name: '37°C Cas9 RNP Complexing',
      durationSeconds: 1200,
      remainingSeconds: 1200,
      isRunning: false,
      isPaused: false,
      type: 'incubation'
    }
  ]);

  // Equipment Bookings
  const [slots, setSlots] = useState<LabSlotBooking[]>(() => {
    const saved = localStorage.getItem('biosynth_slots');
    return saved ? JSON.parse(saved) : SEED_LAB_SLOTS;
  });

  // Mood Logs
  const [moodLogs, setMoodLogs] = useState<MoodLogEntry[]>(() => {
    const saved = localStorage.getItem('biosynth_mood');
    return saved ? JSON.parse(saved) : SEED_MOOD_LOGS;
  });

  // Action Items
  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    const saved = localStorage.getItem('biosynth_actions');
    return saved ? JSON.parse(saved) : SEED_ACTION_ITEMS;
  });

  // Reagent Calculator Modal
  const [calculatorReagents, setCalculatorReagents] = useState<ProtocolReagent[] | null>(null);

  // User Authentication & Cloud Sync
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [showRestartModal, setShowRestartModal] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [authErrorNotice, setAuthErrorNotice] = useState<string | null>(null);
  const [restartToast, setRestartToast] = useState<string | null>(null);
  const [dismissAccountBanner, setDismissAccountBanner] = useState<boolean>(false);

  // Brainstorm Ideas (Synced across devices to user Google Account)
  const [brainstormIdeas, setBrainstormIdeas] = useState<GeneratedIdeaDraft[]>(() => {
    const saved = localStorage.getItem('amyloid_brainstorm_ideas');
    return saved ? JSON.parse(saved) : [];
  });

  // Listen for Google Auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncUserProfile(user);
        const savedData = await loadUserWorkspace(user.uid);
        if (savedData) {
          if (savedData.papers && savedData.papers.length > 0) setPapers(savedData.papers);
          if (savedData.protocols && savedData.protocols.length > 0) setProtocols(savedData.protocols);
          if (savedData.targetOutcomes && savedData.targetOutcomes.length > 0) setTargetOutcomes(savedData.targetOutcomes);
          if (savedData.discardedItems) setDiscardedItems(savedData.discardedItems);
          if (savedData.pipelineRuns && savedData.pipelineRuns.length > 0) setPipelineRuns(savedData.pipelineRuns);
          if (savedData.actionItems && savedData.actionItems.length > 0) setActionItems(savedData.actionItems);
          if (savedData.moodLogs) setMoodLogs(savedData.moodLogs);
          if (savedData.slots) setSlots(savedData.slots);
          if (savedData.brainstormIdeas) setBrainstormIdeas(savedData.brainstormIdeas);
          setLastSavedTime(
            new Date(savedData.lastSavedAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          );
          setCloudSynced(true);
        } else {
          // Initialize new account with starting laboratory datasets
          await saveUserWorkspace(user.uid, {
            papers,
            protocols,
            targetOutcomes,
            discardedItems,
            pipelineRuns,
            actionItems,
            moodLogs,
            slots,
            brainstormIdeas,
            lastSavedAt: new Date().toISOString(),
            savedByEmail: user.email || undefined
          });
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setCloudSynced(true);
        }
      } else {
        setCloudSynced(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save brainstorm ideas locally
  useEffect(() => {
    localStorage.setItem('amyloid_brainstorm_ideas', JSON.stringify(brainstormIdeas));
  }, [brainstormIdeas]);

  // Debounced cloud auto-save whenever any research data changes
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(async () => {
      try {
        const result = await saveUserWorkspace(currentUser.uid, {
          papers,
          protocols,
          targetOutcomes,
          discardedItems,
          pipelineRuns,
          actionItems,
          moodLogs,
          slots,
          brainstormIdeas,
          lastSavedAt: new Date().toISOString(),
          savedByEmail: currentUser.email || undefined
        });
        setCloudSynced(result.cloudSynced);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    papers,
    protocols,
    targetOutcomes,
    discardedItems,
    pipelineRuns,
    actionItems,
    moodLogs,
    slots,
    brainstormIdeas,
    currentUser
  ]);

  // Authentication Handlers
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthErrorNotice(null);
    try {
      const res = await googleSignIn('select_account');
      if (res?.user) {
        setShowAccountModal(false);
        setRestartToast(`Connected Google account: ${res.user.displayName || res.user.email}`);
        setTimeout(() => setRestartToast(null), 4000);
      }
    } catch (err: any) {
      setAuthErrorNotice(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsSigningIn(true);
    setAuthErrorNotice(null);
    try {
      const res = await switchGoogleAccount();
      if (res?.user) {
        setShowAccountModal(false);
        setRestartToast(`Switched to account: ${res.user.displayName || res.user.email}`);
        setTimeout(() => setRestartToast(null), 4000);
      }
    } catch (err: any) {
      setAuthErrorNotice(err?.message || 'Failed to switch Google account');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setCloudSynced(false);
    setShowAccountModal(false);
    setRestartToast('Signed out of Google account');
    setTimeout(() => setRestartToast(null), 4000);
  };

  // Restart Handlers (Delete existing ideas and start afresh)
  const handleRestartIdeas = async () => {
    setBrainstormIdeas([]);
    localStorage.removeItem('amyloid_brainstorm_ideas');
    if (currentUser) {
      await restartUserBrainstormIdeas(currentUser.uid);
    }
    setRestartToast('All existing brainstorm ideas deleted. Starting afresh!');
    setTimeout(() => setRestartToast(null), 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('biosynth_papers', JSON.stringify(papers));
  }, [papers]);

  useEffect(() => {
    localStorage.setItem('biosynth_protocols', JSON.stringify(protocols));
  }, [protocols]);

  useEffect(() => {
    localStorage.setItem('biosynth_target_outcomes', JSON.stringify(targetOutcomes));
  }, [targetOutcomes]);

  useEffect(() => {
    localStorage.setItem('biosynth_discarded', JSON.stringify(discardedItems));
  }, [discardedItems]);

  useEffect(() => {
    localStorage.setItem('biosynth_pipeline_runs', JSON.stringify(pipelineRuns));
  }, [pipelineRuns]);

  useEffect(() => {
    localStorage.setItem('biosynth_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('biosynth_mood', JSON.stringify(moodLogs));
  }, [moodLogs]);

  useEffect(() => {
    localStorage.setItem('biosynth_actions', JSON.stringify(actionItems));
  }, [actionItems]);

  // Handlers for Papers
  const handleUpdatePaper = (updated: ResearchPaper) => {
    setPapers(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleAddPaper = (newP: ResearchPaper) => {
    setPapers(prev => [newP, ...prev]);
    setSelectedPaperId(newP.id);
  };

  const handleDeletePaper = (id: string) => {
    setPapers(prev => prev.filter(p => p.id !== id));
    if (selectedPaperId === id) {
      const remaining = papers.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedPaperId(remaining[0].id);
    }
  };

  // Handlers for Discard
  const handleDiscardItem = (item: DiscardedItem) => {
    setDiscardedItems(prev => [item, ...prev]);
  };

  const handleRestoreDiscardedItem = (item: DiscardedItem) => {
    // Restore to appropriate active collection based on category
    if (item.category === 'figure') {
      // Find parent paper if possible
      const targetPaper = papers.find(p => p.title === item.parentTitle) || papers[0];
      if (targetPaper) {
        const restoredAttachment = {
          id: item.originalId || `fig-restored-${Date.now()}`,
          title: item.title,
          imageUrl: item.imageUrl || '/src/assets/images/bio_lab_bench_hero_1792938142791.jpg',
          createdAt: new Date().toISOString().split('T')[0],
          notes: item.previewText || 'Restored from discard quarantine'
        };
        const currentImages = targetPaper.attachedImages || [];
        handleUpdatePaper({
          ...targetPaper,
          attachedImages: [restoredAttachment, ...currentImages]
        });
      }
    } else if (item.category === 'target_outcome') {
      const restoredRecord: TargetOutcomeRecord = {
        id: item.originalId || `to-restored-${Date.now()}`,
        targetObjective: item.title,
        hypothesis: item.dataPayload?.hypothesis || 'Restored from discard quarantine',
        status: 'In Progress',
        empiricalOutcome: item.previewText || item.dataPayload?.outcome || 'Measurement re-activated.',
        shortcomingsAndPitfalls: ['Restored from quarantine for further replication.'],
        nextIterationAdjustment: 'Re-run assay under tight pH and temperature controls.',
        dateLogged: new Date().toISOString().split('T')[0],
        linkedPaperIds: []
      };
      setTargetOutcomes(prev => [restoredRecord, ...prev]);
    } else if (item.category === 'bioinformatics_run') {
      const restoredRun: BioinformaticsPipelineRun = {
        id: item.originalId || `run-restored-${Date.now()}`,
        pipelineName: item.title,
        category: 'Transcriptomics',
        sampleId: 'Restored_Sample_Batch',
        readType: 'Paired-End 150bp',
        inputFastq: 'data/fastq/restored_reads.fq.gz',
        referenceGenome: 'GRCh38 (Human)',
        status: 'Completed',
        dateRun: new Date().toISOString().split('T')[0],
        parameters: { threads: '8', mode: 'restored' },
        generatedCommands: ['# Restored pipeline run from memory vault'],
        summaryOutput: {
          totalReads: '10,000,000',
          mappingRate: '95.0%',
          notes: 'Restored run.'
        }
      };
      setPipelineRuns(prev => [restoredRun, ...prev]);
    } else if (item.category === 'paper') {
      const restoredPaper: ResearchPaper = {
        id: item.originalId || `paper-restored-${Date.now()}`,
        title: item.title,
        authors: 'Restored Author et al.',
        year: 2026,
        journal: item.parentTitle || 'Journal of Biological Chemistry',
        fieldTag: 'Molecular Genetics',
        targetQuestion: item.previewText || 'Restored paper inquiry.',
        keyFindings: [],
        shortcomings: [],
        relevanceToMyResearch: 'Restored from discard quarantine.',
        readingStatus: 'Reading',
        abstract: item.previewText || 'Restored abstract.',
        notesMarkdown: 'Restored from discard quarantine.',
        highlights: [],
        referencesPaperIds: [],
        dateAdded: new Date().toISOString().split('T')[0]
      };
      setPapers(prev => [restoredPaper, ...prev]);
    }

    // Remove from discarded list
    setDiscardedItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handlePermanentDeleteDiscard = (id: string) => {
    setDiscardedItems(prev => prev.filter(i => i.id !== id));
  };

  const handleEmptyWetDiscard = () => {
    setDiscardedItems(prev => prev.filter(i => i.type !== 'wet'));
  };

  const handleUpdateMemoryReflection = (id: string, reflection: string) => {
    setDiscardedItems(prev =>
      prev.map(i => (i.id === id ? { ...i, memoryReflection: reflection } : i))
    );
  };

  // Handlers for Bioinformatics Studio
  const handleAddPipelineRun = (run: BioinformaticsPipelineRun) => {
    setPipelineRuns(prev => [run, ...prev]);
  };

  const handleUpdatePipelineRun = (run: BioinformaticsPipelineRun) => {
    setPipelineRuns(prev => prev.map(r => (r.id === run.id ? run : r)));
  };

  const handleDiscardPipelineRun = (id: string, type: DiscardType) => {
    const targetRun = pipelineRuns.find(r => r.id === id);
    if (!targetRun) return;

    const discarded: DiscardedItem = {
      id: `discard-${Date.now()}`,
      originalId: targetRun.id,
      type,
      category: 'bioinformatics_run',
      title: targetRun.pipelineName,
      previewText: `Sample: ${targetRun.sampleId} (${targetRun.referenceGenome}). Total reads: ${targetRun.summaryOutput.totalReads || 'N/A'}.`,
      imageUrl: targetRun.plotImage,
      dataPayload: targetRun,
      discardedAt: new Date().toISOString().split('T')[0],
      memoryReflection: type === 'dry'
        ? `Retired pipeline run for ${targetRun.sampleId}. Kept in memory vault for reference.`
        : undefined,
      tags: type === 'dry' ? ['Bioinformatics Run', 'Decommissioned Pipeline'] : undefined,
      parentTitle: 'Bioinformatics Studio'
    };

    handleDiscardItem(discarded);
    setPipelineRuns(prev => prev.filter(r => r.id !== id));
  };

  const handlePushFigureToPaper = (paperId: string, title: string, imageUrl: string, notes: string) => {
    const targetPaper = papers.find(p => p.id === paperId) || papers[0];
    if (!targetPaper) return;

    const newAttachment = {
      id: `fig-bio-${Date.now()}`,
      title,
      imageUrl,
      createdAt: new Date().toISOString().split('T')[0],
      notes
    };

    const currentImages = targetPaper.attachedImages || [];
    handleUpdatePaper({
      ...targetPaper,
      attachedImages: [newAttachment, ...currentImages]
    });
  };

  const handlePushOutcomeToMatrix = (record: TargetOutcomeRecord) => {
    setTargetOutcomes(prev => [record, ...prev]);
  };

  const handlePushSynthesisToPaperNotes = (paperId: string, synthesisText: string) => {
    const target = papers.find(p => p.id === paperId);
    if (!target) return;
    const dateStamp = new Date().toLocaleDateString();
    const updatedNotes = target.notesMarkdown
      ? `${target.notesMarkdown}\n\n### AI Co-Author Brainstorm (${dateStamp}):\n${synthesisText}`
      : `### AI Co-Author Brainstorm (${dateStamp}):\n${synthesisText}`;
    handleUpdatePaper({ ...target, notesMarkdown: updatedNotes });
    setSelectedPaperId(paperId);
    setActiveTab('papers');
  };

  // Handlers for Protocols
  const handleUpdateProtocol = (updated: Protocol) => {
    setProtocols(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const handleAddProtocol = (newP: Protocol) => {
    setProtocols(prev => [newP, ...prev]);
    setSelectedProtocolId(newP.id);
  };

  const handleDeleteProtocol = (id: string) => {
    setProtocols(prev => prev.filter(p => p.id !== id));
    if (selectedProtocolId === id) {
      const remaining = protocols.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedProtocolId(remaining[0].id);
    }
  };

  // Handlers for Target-Outcomes
  const handleAddTargetOutcome = (record: TargetOutcomeRecord) => {
    setTargetOutcomes(prev => [record, ...prev]);
  };

  const handleUpdateTargetOutcome = (record: TargetOutcomeRecord) => {
    setTargetOutcomes(prev => prev.map(r => (r.id === record.id ? record : r)));
  };

  const handleDeleteTargetOutcome = (id: string) => {
    setTargetOutcomes(prev => prev.filter(r => r.id !== id));
  };

  // Handlers for Timers
  const handleAddTimer = (t: LabTimer) => {
    setTimers(prev => [t, ...prev]);
  };

  const handleUpdateTimer = (t: LabTimer) => {
    setTimers(prev => prev.map(timer => (timer.id === t.id ? t : timer)));
  };

  const handleDeleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const handleLaunchStepTimer = (name: string, durationSeconds: number, stepTitle: string) => {
    const newTimer: LabTimer = {
      id: `timer-${Date.now()}`,
      name,
      durationSeconds,
      remainingSeconds: durationSeconds,
      isRunning: true,
      isPaused: false,
      type: 'incubation',
      protocolStepTitle: stepTitle
    };
    setTimers(prev => [newTimer, ...prev]);
    setActiveTab('timers');
  };

  // Handlers for Slots
  const handleAddSlot = (s: LabSlotBooking) => {
    setSlots(prev => [s, ...prev]);
  };

  const handleDeleteSlot = (id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleUpdateSlot = (s: LabSlotBooking) => {
    setSlots(prev => prev.map(slot => (slot.id === s.id ? s : slot)));
  };

  // Handlers for Mood
  const handleAddMood = (entry: MoodLogEntry) => {
    setMoodLogs(prev => [...prev, entry]);
  };

  const handleDeleteMood = (id: string) => {
    setMoodLogs(prev => prev.filter(m => m.id !== id));
  };

  // Handlers for Action Items
  const handleToggleAction = (id: string) => {
    setActionItems(prev => prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item)));
  };

  const handleAddAction = (item: ActionItem) => {
    setActionItems(prev => [item, ...prev]);
  };

  const handleDeleteAction = (id: string) => {
    setActionItems(prev => prev.filter(i => i.id !== id));
  };

  const activeTimersRunningCount = timers.filter(t => t.isRunning && !t.isPaused && t.remainingSeconds > 0).length;
  const wetDiscardCount = discardedItems.filter(i => i.type === 'wet').length;
  const dryDiscardCount = discardedItems.filter(i => i.type === 'dry').length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        theme === 'sepia'
          ? 'bg-[#f5eedc] text-[#3d2f20]'
          : theme === 'black'
          ? 'bg-[#09090b] text-[#f4f4f5]'
          : theme === 'pink'
          ? 'bg-[#fff0f3] text-[#4a0422]'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickTimerOpen={() => setActiveTab('timers')}
        activeTimersCount={activeTimersRunningCount}
        wetDiscardCount={wetDiscardCount}
        dryDiscardCount={dryDiscardCount}
        theme={theme}
        onThemeChange={setTheme}
        brightness={brightness}
        onBrightnessChange={setBrightness}
        currentUser={currentUser}
        onOpenAccountModal={() => setShowAccountModal(true)}
        onSwitchAccount={handleSwitchAccount}
        onSignOut={handleSignOut}
        lastSavedTime={lastSavedTime}
        cloudSynced={cloudSynced}
        onOpenRestartModal={() => setShowRestartModal(true)}
      />

      {/* Main Content Area - CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) */}
      <main
        className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-colors duration-200 ${
          theme === 'sepia'
            ? 'bg-[#f5eedc] text-[#3d2f20]'
            : theme === 'black'
            ? 'bg-[#09090b] text-[#f4f4f5]'
            : theme === 'pink'
            ? 'bg-[#fff0f3] text-[#4a0422]'
            : 'bg-slate-50 text-slate-900'
        }`}
        style={{
          filter: `brightness(${brightness}%)`,
          transition: 'filter 0.15s ease-out, background-color 0.2s ease-in-out'
        }}
      >
        {/* Google Account Cloud Save Notice Banner (if logged out) */}
        {!currentUser && !dismissAccountBanner && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-50 via-indigo-50 to-amber-50 border border-teal-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                <svg className="w-full h-full" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  Save your laboratory research with a Google Account
                </p>
                <p className="text-xs text-slate-600">
                  Sign in once to automatically backup your papers, protocols, and ideas to the cloud and switch accounts seamlessly.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => setShowAccountModal(true)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Sign In with Google
              </button>
              <button
                onClick={() => setDismissAccountBanner(true)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white/60 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {activeTab === 'papers' && (
          <PaperSynthesizer
            papers={papers}
            selectedPaperId={selectedPaperId}
            onSelectPaper={setSelectedPaperId}
            onUpdatePaper={handleUpdatePaper}
            onAddPaper={handleAddPaper}
            onDeletePaper={handleDeletePaper}
            onDiscardItem={handleDiscardItem}
          />
        )}

        {activeTab === 'protocols' && (
          <ProtocolBuilder
            protocols={protocols}
            selectedProtocolId={selectedProtocolId}
            onSelectProtocol={setSelectedProtocolId}
            onUpdateProtocol={handleUpdateProtocol}
            onAddProtocol={handleAddProtocol}
            onDeleteProtocol={handleDeleteProtocol}
            onLaunchTimer={handleLaunchStepTimer}
            onOpenReagentCalculator={reagents => setCalculatorReagents(reagents)}
          />
        )}

        {activeTab === 'bioinformatics' && (
          <BioinformaticsStudio
            pipelineRuns={pipelineRuns}
            papers={papers}
            protocols={protocols}
            targetOutcomes={targetOutcomes}
            onAddPipelineRun={handleAddPipelineRun}
            onUpdatePipelineRun={handleUpdatePipelineRun}
            onDiscardPipelineRun={handleDiscardPipelineRun}
            onPushFigureToPaper={handlePushFigureToPaper}
            onPushOutcomeToMatrix={handlePushOutcomeToMatrix}
            onNavigateToPaper={id => {
              setSelectedPaperId(id);
              setActiveTab('papers');
            }}
            onNavigateToProtocol={id => {
              setSelectedProtocolId(id);
              setActiveTab('protocols');
            }}
          />
        )}

        {activeTab === 'targets' && (
          <TargetOutcomesMatrix
            records={targetOutcomes}
            protocols={protocols}
            papers={papers}
            onAddRecord={handleAddTargetOutcome}
            onUpdateRecord={handleUpdateTargetOutcome}
            onDeleteRecord={handleDeleteTargetOutcome}
            onDiscardRecord={handleDiscardItem}
            onNavigateToProtocol={id => {
              setSelectedProtocolId(id);
              setActiveTab('protocols');
            }}
          />
        )}

        {activeTab === 'ai-studio' && (
          <AIWritingBrainstormStudio
            papers={papers}
            protocols={protocols}
            targetOutcomes={targetOutcomes}
            pipelineRuns={pipelineRuns}
            onNavigateToPaper={id => {
              setSelectedPaperId(id);
              setActiveTab('papers');
            }}
            onNavigateToProtocol={id => {
              setSelectedProtocolId(id);
              setActiveTab('protocols');
            }}
            onPushToPaperNotes={handlePushSynthesisToPaperNotes}
            brainstormIdeas={brainstormIdeas as any}
            onIdeasChange={setBrainstormIdeas as any}
            onRestartSession={handleRestartIdeas}
            currentUser={currentUser}
            onSwitchAccount={handleSwitchAccount}
          />
        )}

        {activeTab === 'discards' && (
          <DiscardMemoryVault
            discardedItems={discardedItems}
            onRestoreItem={handleRestoreDiscardedItem}
            onPermanentDelete={handlePermanentDeleteDiscard}
            onEmptyWetDiscard={handleEmptyWetDiscard}
            onUpdateMemoryReflection={handleUpdateMemoryReflection}
          />
        )}

        {activeTab === 'timers' && (
          <BenchTimersAndSlots
            timers={timers}
            slots={slots}
            onAddTimer={handleAddTimer}
            onUpdateTimer={handleUpdateTimer}
            onDeleteTimer={handleDeleteTimer}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
            onUpdateSlot={handleUpdateSlot}
          />
        )}

        {activeTab === 'actions' && (
          <div className="space-y-8">
            <WhatToDoNext
              items={actionItems}
              papers={papers}
              protocols={protocols}
              onToggleItem={handleToggleAction}
              onAddItem={handleAddAction}
              onDeleteItem={handleDeleteAction}
              onNavigateToPaper={id => {
                setSelectedPaperId(id);
                setActiveTab('papers');
              }}
              onNavigateToProtocol={id => {
                setSelectedProtocolId(id);
                setActiveTab('protocols');
              }}
            />

            <MoodEnergyTracker
              entries={moodLogs}
              onAddEntry={handleAddMood}
              onDeleteEntry={handleDeleteMood}
            />
          </div>
        )}
      </main>

      {/* Reagent & Master Mix Calculator Modal */}
      {calculatorReagents !== null && (
        <ReagentCalculatorModal
          initialReagents={calculatorReagents}
          onClose={() => setCalculatorReagents(null)}
        />
      )}

      {/* Google Account & Switch Account Modal */}
      <GoogleAccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSwitchAccount={handleSwitchAccount}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        lastSavedTime={lastSavedTime}
        cloudSynced={cloudSynced}
        errorMessage={authErrorNotice}
      />

      {/* Restart Ideas & Start Afresh Modal */}
      <RestartConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirmRestartAll={handleRestartIdeas}
        onConfirmResetScratchpad={() => {
          setRestartToast('Editor scratchpad cleared. Ready to start afresh!');
          setTimeout(() => setRestartToast(null), 4000);
        }}
        ideasCount={brainstormIdeas.length}
      />

      {/* Floating Status Toast */}
      {restartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
          <span>{restartToast}</span>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`border-t py-6 mt-12 text-xs transition-colors ${
          theme === 'sepia'
            ? 'border-[#e2d2b7] bg-[#faf4e8] text-[#6e5842]'
            : theme === 'black'
            ? 'border-[#27272a] bg-[#121215] text-[#a1a1aa]'
            : theme === 'pink'
            ? 'border-[#fbcfe8] bg-[#ffffff] text-[#701a75]'
            : 'border-slate-200 bg-white text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <span className={`font-bold ${theme === 'black' ? 'text-white' : 'text-slate-800'}`}>
            Amyloid Lab Assistant
          </span>
        </div>
      </footer>
    </div>
  );
}
