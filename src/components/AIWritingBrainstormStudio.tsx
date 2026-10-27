import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  Send,
  Brain,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  RefreshCw,
  Sliders,
  Download,
  BookOpen,
  FlaskConical,
  Database,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronDown,
  Info,
  Mail,
  HelpCircle,
  ShieldAlert,
  ClipboardCheck,
  CheckSquare,
  ArrowRight,
  RotateCcw,
  Trash2,
  Users
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ResearchPaper, Protocol, TargetOutcomeRecord, BioinformaticsPipelineRun } from '../types';
import {
  initAuth,
  googleSignIn,
  switchGoogleAccount,
  logout,
  getAccessToken,
  requestWorkspaceScopes,
  getWorkspaceAccessToken,
  parseAuthError,
  AuthErrorInfo
} from '../services/authService';
import { exportToGoogleDoc, GoogleDocExportResult } from '../services/googleDocsService';
import { generateScientificFallback } from '../services/scientificSynthesis';
import {
  sendEmailViaGmail,
  createGmailDraft,
  GmailSendResult
} from '../services/gmailService';
import { RestartConfirmModal } from './RestartConfirmModal';

export type AIModelPersona = 'gemini' | 'chatgpt' | 'claude';

export type WritingMode =
  | 'abstract_discussion'
  | 'hypothesis'
  | 'protocol_troubleshoot'
  | 'aim_grant'
  | 'freeform';

interface AIWritingBrainstormStudioProps {
  papers: ResearchPaper[];
  protocols: Protocol[];
  targetOutcomes: TargetOutcomeRecord[];
  pipelineRuns: BioinformaticsPipelineRun[];
  brainstormIdeas?: GeneratedDraft[];
  onIdeasChange?: (ideas: GeneratedDraft[]) => void;
  onRestartSession?: () => void;
  currentUser?: User | null;
  onSwitchAccount?: () => void;
  onNavigateToPaper?: (paperId: string) => void;
  onNavigateToProtocol?: (protocolId: string) => void;
  onPushToPaperNotes?: (paperId: string, synthesisText: string) => void;
}

export interface GeneratedDraft {
  id: string;
  title: string;
  content: string;
  model: AIModelPersona;
  mode: WritingMode;
  createdAt: string;
  exportedDoc?: GoogleDocExportResult;
  gmailResult?: GmailSendResult & { recipient?: string };
}

const PROMPT_SUGGESTIONS: { label: string; mode: WritingMode; model: AIModelPersona; prompt: string }[] = [
  {
    label: 'Hypothesis: Amyloid Beta Oligomer Cross-Seeding',
    mode: 'hypothesis',
    model: 'gemini',
    prompt: 'Propose a testable hypothesis evaluating whether alpha-synuclein oligomers cross-seed amyloid-beta (Abeta42) fibrillization in vitro, detailing ThT fluorescence kinetics, circular dichroism, negative-stain TEM, and negative control monomers.'
  },
  {
    label: 'Protocol: Thioflavin T (ThT) Fibrillation Optimization',
    mode: 'protocol_troubleshoot',
    model: 'chatgpt',
    prompt: 'Our ThT fluorescence amyloid aggregation assay has high plate-to-plate variance and erratic lag phases. Diagnose potential meniscus artifacts, quiescent vs shaking agitation issues, and provide an optimization checklist.'
  },
  {
    label: 'Grant: NIH Specific Aims for Amyloid Disaggregase',
    mode: 'aim_grant',
    model: 'claude',
    prompt: 'Draft an NIH-style Specific Aim 1 (Engineered Hsp104 disaggregase variants kinetics on mature amyloid fibrils) and Specific Aim 2 (Primary cortical neuronal toxicity rescue and synaptic spine density quantification).'
  },
  {
    label: 'Abstract & Discussion: Cryo-EM Amyloid Polymorphs',
    mode: 'abstract_discussion',
    model: 'gemini',
    prompt: 'Co-author a high-impact abstract and discussion highlighting how patient-derived tau/amyloid fibril structures reveal disease-specific polymorphs that explain clinical phenotypic heterogeneity.'
  }
];

export const AIWritingBrainstormStudio: React.FC<AIWritingBrainstormStudioProps> = ({
  papers,
  protocols,
  targetOutcomes,
  pipelineRuns,
  brainstormIdeas,
  onIdeasChange,
  onRestartSession,
  currentUser: propUser,
  onSwitchAccount: propSwitchAccount,
  onPushToPaperNotes
}) => {
  // Model selection
  const [selectedModel, setSelectedModel] = useState<AIModelPersona>('gemini');
  const [selectedMode, setSelectedMode] = useState<WritingMode>('hypothesis');

  // Input state
  const [promptInput, setPromptInput] = useState<string>('');
  const [docTitleInput, setDocTitleInput] = useState<string>('Amyloid Research Synthesis');

  // Context Injection selection
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('');
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState<boolean>(false);

  // Generation state & Restart state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const [draftHistory, setDraftHistory] = useState<GeneratedDraft[]>(() => {
    return brainstormIdeas && brainstormIdeas.length > 0 ? brainstormIdeas : [];
  });
  const [activeDraftIndex, setActiveDraftIndex] = useState<number>(-1);
  const [generationSourceNotice, setGenerationSourceNotice] = useState<string>('');
  const [showRestartModal, setShowRestartModal] = useState<boolean>(false);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Sync draftHistory with brainstormIdeas prop
  useEffect(() => {
    if (brainstormIdeas) {
      setDraftHistory(brainstormIdeas);
    }
  }, [brainstormIdeas]);

  // Google OAuth & Docs Export state
  const [currentUser, setCurrentUser] = useState<User | null>(propUser || null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessResult, setExportSuccessResult] = useState<GoogleDocExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Gmail Feature state
  const [showGmailModal, setShowGmailModal] = useState<boolean>(false);
  const [gmailRecipient, setGmailRecipient] = useState<string>('');
  const [gmailSubject, setGmailSubject] = useState<string>('');
  const [gmailMode, setGmailMode] = useState<'send' | 'draft'>('send');
  const [gmailIntroNote, setGmailIntroNote] = useState<string>('');
  const [isSendingGmail, setIsSendingGmail] = useState<boolean>(false);
  const [gmailSuccessResult, setGmailSuccessResult] = useState<(GmailSendResult & { recipient?: string; mode: 'send' | 'draft' }) | null>(null);
  const [showSendConfirmation, setShowSendConfirmation] = useState<boolean>(false);

  // Auth Troubleshooting Modal state
  const [showAuthHelpModal, setShowAuthHelpModal] = useState<boolean>(false);
  const [authErrorInfo, setAuthErrorInfo] = useState<AuthErrorInfo | null>(null);
  const [domainCopied, setDomainCopied] = useState<boolean>(false);

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Handle Google Sign-in
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setExportError(null);
    setAuthErrorInfo(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const parsed = parseAuthError(err);
      setAuthErrorInfo(parsed);
      setExportError(err.message || 'Failed to authenticate with Google.');
      if (parsed.isUnauthorizedDomain || parsed.isAccessBlockedOrVerification) {
        setShowAuthHelpModal(true);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setExportSuccessResult(null);
    setGmailSuccessResult(null);
  };

  // Handle Switch Google Account
  const handleSwitchGoogleAccount = async () => {
    if (propSwitchAccount) {
      propSwitchAccount();
      return;
    }
    setIsSigningIn(true);
    setExportError(null);
    setAuthErrorInfo(null);
    try {
      const result = await switchGoogleAccount();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        setSessionNotice(`Switched to account: ${result.user.displayName || result.user.email}`);
        setTimeout(() => setSessionNotice(null), 4000);
      }
    } catch (err: any) {
      console.error('Switch account error:', err);
      const parsed = parseAuthError(err);
      setAuthErrorInfo(parsed);
      setExportError(err.message || 'Failed to switch Google account.');
      if (parsed.isUnauthorizedDomain || parsed.isAccessBlockedOrVerification) {
        setShowAuthHelpModal(true);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Restart Handlers: Delete ideas and start afresh
  const handleRestartAllIdeas = () => {
    setDraftHistory([]);
    setCurrentDraft('');
    setPromptInput('');
    setActiveDraftIndex(-1);
    setSelectedPaperId('');
    setSelectedProtocolId('');
    setSelectedOutcomeId('');
    setSelectedRunId('');
    setExportSuccessResult(null);
    setGmailSuccessResult(null);
    if (onIdeasChange) {
      onIdeasChange([]);
    }
    if (onRestartSession) {
      onRestartSession();
    }
    setSessionNotice('All generated ideas deleted. Canvas restarted afresh!');
    setTimeout(() => setSessionNotice(null), 4000);
  };

  const handleResetEditorOnly = () => {
    setCurrentDraft('');
    setPromptInput('');
    setActiveDraftIndex(-1);
    setExportSuccessResult(null);
    setGmailSuccessResult(null);
    setSessionNotice('Editor cleared. Ready to compose a new hypothesis.');
    setTimeout(() => setSessionNotice(null), 4000);
  };

  const handleDeleteSingleDraft = (id: string) => {
    const updated = draftHistory.filter(d => d.id !== id);
    setDraftHistory(updated);
    if (onIdeasChange) {
      onIdeasChange(updated);
    }
    if (activeDraftIndex >= 0 && draftHistory[activeDraftIndex]?.id === id) {
      setCurrentDraft('');
      setActiveDraftIndex(-1);
    }
  };

  // Compile context payload from selected lab assets
  const compileContextData = (): string => {
    const parts: string[] = [];

    if (selectedPaperId) {
      const paper = papers.find(p => p.id === selectedPaperId);
      if (paper) {
        parts.push(
          `[RESEARCH PAPER]: ${paper.title} (${paper.authors}, ${paper.year}, ${paper.journal})\n` +
          `Target Question: ${paper.targetQuestion}\n` +
          `Key Findings: ${paper.keyFindings.join('; ')}\n` +
          `Relevance: ${paper.relevanceToMyResearch}\n` +
          `Abstract Snippet: ${paper.abstract.slice(0, 300)}...`
        );
      }
    }

    if (selectedProtocolId) {
      const proto = protocols.find(p => p.id === selectedProtocolId);
      if (proto) {
        const stepsPreview = proto.steps.map((s, idx) => `${idx + 1}. ${s.title} (${s.instruction})`).join('\n');
        parts.push(
          `[LAB PROTOCOL]: ${proto.title} (${proto.category}, Target: ${proto.target}, Expected: ${proto.expectedOutcomes})\n` +
          `Steps Summary:\n${stepsPreview}`
        );
      }
    }

    if (selectedOutcomeId) {
      const outcome = targetOutcomes.find(o => o.id === selectedOutcomeId);
      if (outcome) {
        parts.push(
          `[EMPIRICAL BENCH OUTCOME]: Objective: ${outcome.targetObjective} (Status: ${outcome.status})\n` +
          `Hypothesis: ${outcome.hypothesis}\n` +
          `Measured Outcome: ${outcome.empiricalOutcome}\n` +
          `Shortcomings: ${outcome.shortcomingsAndPitfalls.join('; ')}\n` +
          `Next Iteration: ${outcome.nextIterationAdjustment}`
        );
      }
    }

    if (selectedRunId) {
      const run = pipelineRuns.find(r => r.id === selectedRunId);
      if (run) {
        parts.push(
          `[BIOINFORMATICS PIPELINE RUN]: ${run.pipelineName} (Sample: ${run.sampleId}, Status: ${run.status})\n` +
          `Reference Genome: ${run.referenceGenome}, Total Reads: ${run.summaryOutput.totalReads || 'N/A'}, Mapping Rate: ${run.summaryOutput.mappingRate || 'N/A'}`
        );
      }
    }

    return parts.join('\n\n---\n\n');
  };

  // Generate brainstorm/writing with selected AI model
  const handleGenerate = async (overridePrompt?: string) => {
    const textToRun = (overridePrompt ?? promptInput).trim();
    if (!textToRun) return;

    setIsGenerating(true);
    setExportSuccessResult(null);
    setGmailSuccessResult(null);
    setExportError(null);

    const contextData = compileContextData();

    let generatedResult = '';
    let sourceNotice = '';

    try {
      try {
        const response = await fetch('/api/ai/brainstorm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelPersona: selectedModel,
            mode: selectedMode,
            prompt: textToRun,
            contextData: contextData || undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          generatedResult = data.text || '';
          sourceNotice = data.source || (data.isFallback ? 'Amyloid Synthesis Engine' : 'AI Model');
        } else {
          throw new Error(`Server returned HTTP ${response.status}`);
        }
      } catch (networkOrApiErr) {
        // Fall back seamlessly to client-side scientific synthesis engine (e.g. when hosted as static Vite SPA on Vercel)
        console.warn('Backend API unavailable, using high-fidelity client scientific synthesis engine:', networkOrApiErr);
        generatedResult = generateScientificFallback(selectedModel, selectedMode, textToRun, contextData || undefined);
        sourceNotice = `BioSynth Scientific Engine (${selectedModel.toUpperCase()} Persona)`;
      }

      if (!generatedResult) {
        generatedResult = generateScientificFallback(selectedModel, selectedMode, textToRun, contextData || undefined);
        sourceNotice = `BioSynth Scientific Engine (${selectedModel.toUpperCase()} Persona)`;
      }

      setCurrentDraft(generatedResult);
      setGenerationSourceNotice(sourceNotice);

      // Automatically construct a suggested Google Doc / Email title
      let generatedDocTitle = 'Amyloid Research Synthesis';
      if (textToRun.length > 0) {
        generatedDocTitle = `${selectedModel.toUpperCase()}: ${textToRun.slice(0, 45).replace(/[^a-zA-Z0-9 ]/g, '')}...`;
      }
      setDocTitleInput(generatedDocTitle);
      setGmailSubject(`[Amyloid Lab Assistant] ${generatedDocTitle}`);

      const newDraftItem: GeneratedDraft = {
        id: `draft-${Date.now()}`,
        title: generatedDocTitle,
        content: generatedResult,
        model: selectedModel,
        mode: selectedMode,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setDraftHistory(prev => {
        const next = [newDraftItem, ...prev];
        if (onIdeasChange) {
          onIdeasChange(next);
        }
        return next;
      });
      setActiveDraftIndex(0);
    } catch (err: any) {
      console.error('Generation failure:', err);
      setExportError(`Generation failed: ${err.message}. Please retry.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Perform Google Docs Export
  const handleConfirmGoogleDocExport = async () => {
    if (!currentDraft.trim()) {
      setExportError('Cannot export an empty draft. Please generate or write content first.');
      return;
    }

    if (!currentUser) {
      setShowExportModal(false);
      setExportError('Please sign in with Google to export to Google Docs.');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      let token = await getWorkspaceAccessToken();
      if (!token) {
        try {
          token = await requestWorkspaceScopes();
        } catch (scopeErr: any) {
          const parsed = parseAuthError(scopeErr);
          setAuthErrorInfo(parsed);
          if (parsed.isAccessBlockedOrVerification) {
            setShowAuthHelpModal(true);
            throw new Error('Google Docs permission requires GCP OAuth verification. Click "Open in docs.new" below to paste directly into Google Docs!');
          }
          throw scopeErr;
        }
      }

      if (!token) {
        throw new Error('Google Workspace authorization required.');
      }

      const result = await exportToGoogleDoc(
        {
          title: docTitleInput.trim() || `Amyloid Lab Assistant Research - ${new Date().toISOString().split('T')[0]}`,
          markdownContent: currentDraft,
          modelPersona: selectedModel,
          mode: selectedMode,
          researcherName: currentUser?.displayName || undefined,
        },
        token
      );

      setExportSuccessResult(result);
      setShowExportModal(false);

      // Update current draft record with exported doc info
      if (activeDraftIndex >= 0 && draftHistory[activeDraftIndex]) {
        setDraftHistory(prev =>
          prev.map((d, idx) => (idx === activeDraftIndex ? { ...d, exportedDoc: result } : d))
        );
      }
    } catch (err: any) {
      console.error('Export error:', err);
      setExportError(err.message || 'Google Docs export failed. Please verify permissions or use the Instant docs.new option.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenDocsNewWithClipboard = () => {
    if (!currentDraft.trim()) return;
    navigator.clipboard.writeText(currentDraft);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    window.open('https://docs.new', '_blank', 'noopener,noreferrer');
    setShowExportModal(false);
    setSessionNotice('Copied draft to clipboard! Opened Google Docs in a new tab — press Ctrl+V (or Cmd+V) to paste.');
    setTimeout(() => setSessionNotice(null), 5000);
  };

  // Open Gmail Modal
  const handleOpenGmailModal = () => {
    if (!currentDraft.trim()) {
      setExportError('Generate or write synthesis content before sending via Gmail.');
      return;
    }

    setGmailSubject(`[Amyloid Lab Assistant] ${docTitleInput}`);
    setShowSendConfirmation(false);
    setShowGmailModal(true);
  };

  // Compile final email text body
  const compileEmailBody = (): string => {
    const parts: string[] = [];
    if (gmailIntroNote.trim()) {
      parts.push(gmailIntroNote.trim());
      parts.push('----------------------------------------\n');
    }
    parts.push(`Amyloid Lab Assistant — Scientific Brainstorm Synthesis`);
    parts.push(`Model Persona: ${selectedModel.toUpperCase()} | Mode: ${selectedMode}`);
    parts.push(`Generated: ${new Date().toLocaleString()}`);
    if (currentUser?.displayName || currentUser?.email) {
      parts.push(`Researcher: ${currentUser.displayName || currentUser.email}`);
    }
    parts.push('\n========================================\n');
    parts.push(currentDraft);
    parts.push('\n========================================\n');
    parts.push('Generated with Amyloid Lab Assistant.');
    return parts.join('\n');
  };

  // Instant Gmail Web Compose (Zero OAuth permission required, 100% reliable)
  const handleOpenGmailWeb = () => {
    if (!currentDraft.trim()) return;
    const emailBody = compileEmailBody();
    const recipient = gmailRecipient.trim();
    const subject = gmailSubject.trim() || `[Amyloid Lab Assistant] ${docTitleInput}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setShowGmailModal(false);
    setShowSendConfirmation(false);
    setSessionNotice('Opened pre-filled Gmail compose window in a new tab! No verification needed.');
    setTimeout(() => setSessionNotice(null), 5000);
  };

  const handleOpenMailto = () => {
    if (!currentDraft.trim()) return;
    const emailBody = compileEmailBody();
    const recipient = gmailRecipient.trim();
    const subject = gmailSubject.trim() || `[Amyloid Lab Assistant] ${docTitleInput}`;
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    setShowGmailModal(false);
    setShowSendConfirmation(false);
  };

  const handleCopyEmailContent = () => {
    const emailBody = compileEmailBody();
    navigator.clipboard.writeText(`To: ${gmailRecipient}\nSubject: ${gmailSubject}\n\n${emailBody}`);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    setSessionNotice('Email subject and body copied to clipboard!');
    setTimeout(() => setSessionNotice(null), 4000);
  };

  // Execute Direct Gmail API Send or Draft Creation
  const handleExecuteGmailAction = async () => {
    if (!gmailRecipient.trim() && gmailMode === 'send') {
      setExportError('Please enter a valid recipient email address.');
      return;
    }

    if (!currentUser) {
      setShowGmailModal(false);
      setShowSendConfirmation(false);
      setExportError('Please sign in with Google first.');
      return;
    }

    setIsSendingGmail(true);
    setExportError(null);

    const emailBody = compileEmailBody();
    const payload = {
      to: gmailRecipient.trim() || currentUser?.email || 'me',
      subject: gmailSubject.trim() || `[Amyloid Lab Assistant] ${docTitleInput}`,
      bodyText: emailBody,
      fromName: currentUser?.displayName || undefined
    };

    try {
      let token = await getWorkspaceAccessToken();
      if (!token) {
        try {
          token = await requestWorkspaceScopes();
        } catch (scopeErr: any) {
          const parsed = parseAuthError(scopeErr);
          setAuthErrorInfo(parsed);
          if (parsed.isAccessBlockedOrVerification) {
            setShowAuthHelpModal(true);
            throw new Error('Gmail API requires GCP OAuth verification approval. Use the "Instant Gmail Web Compose" button above to send immediately!');
          }
          throw scopeErr;
        }
      }

      if (!token) {
        throw new Error('Google authorization required. Please reconnect your Google account.');
      }

      let result: GmailSendResult;
      if (gmailMode === 'draft') {
        result = await createGmailDraft(payload, token);
      } else {
        result = await sendEmailViaGmail(payload, token);
      }

      setGmailSuccessResult({
        ...result,
        recipient: payload.to,
        mode: gmailMode
      });

      setShowSendConfirmation(false);
      setShowGmailModal(false);

      // Update current draft item in history
      if (activeDraftIndex >= 0 && draftHistory[activeDraftIndex]) {
        setDraftHistory(prev =>
          prev.map((d, idx) =>
            idx === activeDraftIndex
              ? { ...d, gmailResult: { ...result, recipient: payload.to } }
              : d
          )
        );
      }
    } catch (err: any) {
      console.error('Gmail action failed:', err);
      setExportError(err.message || 'Gmail operation failed. Please check permissions or use Instant Gmail Web Compose.');
    } finally {
      setIsSendingGmail(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!currentDraft) return;
    navigator.clipboard.writeText(currentDraft);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!currentDraft) return;
    const blob = new Blob([currentDraft], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitleInput.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCurrentDomain = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.hostname);
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2500);
    }
  };

  const activeContextCount = [selectedPaperId, selectedProtocolId, selectedOutcomeId, selectedRunId].filter(Boolean).length;
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'your-app-domain';

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Multi-Model Scientific Co-Author
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <FileText className="w-3.5 h-3.5" />
                Google Docs Direct Export
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <Mail className="w-3.5 h-3.5" />
                Gmail Draft & Dispatch
              </span>
              {/* Restart Ideas & Start Afresh button */}
              <button
                onClick={() => setShowRestartModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 transition-all shadow-sm"
                title="Delete existing ideas and start afresh"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span>Restart Ideas (Start Afresh)</span>
                {draftHistory.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-950/70 text-rose-200 text-[10px] font-mono">
                    {draftHistory.length}
                  </span>
                )}
              </button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Scientific Writing & Brainstorm Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Synthesize amyloid aggregation hypotheses, experimental matrices, and grant aims using Gemini, ChatGPT, and Claude personas with direct one-click Google Docs export and Gmail dispatch.
            </p>
          </div>

          {/* Google Account & Workspace Connection Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-teal-400 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-[10px] text-teal-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Docs & Gmail Connected
                  </div>
                </div>
                {/* Switch Account button */}
                <button
                  onClick={handleSwitchGoogleAccount}
                  title="Switch Google Account"
                  className="px-2 py-1 rounded-md text-[11px] font-semibold text-slate-200 bg-slate-700 hover:bg-teal-700/70 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Users className="w-3 h-3 text-teal-300" />
                  <span>Switch</span>
                </button>
                <button
                  onClick={handleGoogleLogout}
                  title="Disconnect Google"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Official Material Design Google Sign-in */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-white text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm border border-slate-300 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>

                <button
                  onClick={() => setShowAuthHelpModal(true)}
                  title="Connection & Authorization Guide"
                  className="p-2 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Model Persona Selector Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Gemini */}
          <button
            onClick={() => setSelectedModel('gemini')}
            className={`p-3 rounded-xl text-left border transition-all ${
              selectedModel === 'gemini'
                ? 'bg-teal-500/15 border-teal-400 text-white shadow-sm ring-1 ring-teal-400'
                : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm flex items-center gap-1.5 text-teal-300">
                <Sparkles className="w-4 h-4" />
                Google Gemini
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-200 border border-teal-500/30">
                Flash 3.8
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              Deeply grounded amyloid aggregation kinetics, ThT assays, cryo-EM polymorphs, and structural biochemistry.
            </p>
          </button>

          {/* Claude */}
          <button
            onClick={() => setSelectedModel('claude')}
            className={`p-3 rounded-xl text-left border transition-all ${
              selectedModel === 'claude'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm ring-1 ring-amber-400'
                : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm flex items-center gap-1.5 text-amber-300">
                <Brain className="w-4 h-4" />
                Anthropic Claude
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-500/30">
                Sonnet 3.7
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              Critical peer-review rigor, alternative interpretations of fibril seeding, and grant aims scrutiny.
            </p>
          </button>

          {/* ChatGPT */}
          <button
            onClick={() => setSelectedModel('chatgpt')}
            className={`p-3 rounded-xl text-left border transition-all ${
              selectedModel === 'chatgpt'
                ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm ring-1 ring-emerald-400'
                : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm flex items-center gap-1.5 text-emerald-300">
                <Sliders className="w-4 h-4" />
                OpenAI ChatGPT
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-500/30">
                GPT-4o
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              Actionable wet bench protocols, buffer recipes (HEPES/PBS), sonication parameters, and multi-well checklists.
            </p>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Prompts, Controls & Context Injection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Writing Mode Selector */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Writing & Brainstorm Mode
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'hypothesis', label: 'Hypothesis & Matrix', desc: 'Assays, controls & confounders' },
                { id: 'protocol_troubleshoot', label: 'Protocol Fixer', desc: 'Yield, purity & buffer fixes' },
                { id: 'abstract_discussion', label: 'Abstract & Paper', desc: 'Discussion & synthesis' },
                { id: 'aim_grant', label: 'Grant Specific Aims', desc: 'NIH/NSF milestone format' },
                { id: 'freeform', label: 'Freeform Lab Brainstorm', desc: 'Open notebook exploration' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as WritingMode)}
                  className={`p-2.5 rounded-lg text-left border transition-all ${
                    selectedMode === mode.id
                      ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold truncate">{mode.label}</div>
                  <div className="text-[11px] text-slate-500 truncate">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Context Injection Accordion */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setIsContextDrawerOpen(!isContextDrawerOpen)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Inject LabOS Context Data
                </span>
                {activeContextCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full">
                    {activeContextCount} Attached
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isContextDrawerOpen ? 'rotate-180' : ''}`} />
            </button>

            {isContextDrawerOpen && (
              <div className="p-4 space-y-3 border-t border-slate-100 text-xs">
                <p className="text-[11px] text-slate-500">
                  Select items from your active lab database to inject as grounding context for the AI:
                </p>

                {/* Paper selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Reference Paper:
                  </label>
                  <select
                    value={selectedPaperId}
                    onChange={e => setSelectedPaperId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">None (No paper attached)</option>
                    {papers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title.slice(0, 48)}... ({p.year})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Protocol selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                    Wet Lab Protocol:
                  </label>
                  <select
                    value={selectedProtocolId}
                    onChange={e => setSelectedProtocolId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">None (No protocol attached)</option>
                    {protocols.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Outcome selector */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    Target & Empirical Outcome:
                  </label>
                  <select
                    value={selectedOutcomeId}
                    onChange={e => setSelectedOutcomeId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">None (No empirical outcome attached)</option>
                    {targetOutcomes.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.targetObjective.slice(0, 40)}... ({o.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bioinformatics Pipeline Run */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    Bioinformatics Pipeline Run:
                  </label>
                  <select
                    value={selectedRunId}
                    onChange={e => setSelectedRunId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="">None (No pipeline run attached)</option>
                    {pipelineRuns.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.pipelineName} ({r.sampleId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Starters */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Amyloid Research Starters
            </span>
            <div className="flex flex-col gap-1.5">
              {PROMPT_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptInput(s.prompt);
                    setSelectedMode(s.mode);
                    setSelectedModel(s.model);
                  }}
                  className="text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100 flex items-start gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Research Prompt Input */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Research Inquiry & Instructions
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {promptInput.length} chars
              </span>
            </div>

            <textarea
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              placeholder="e.g. Design a multi-well ThT kinetics experiment to test small molecule inhibitors against Abeta42 aggregation with negative controls and seed concentrations..."
              rows={5}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-sans"
            />

            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !promptInput.trim()}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing with {selectedModel.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate with {selectedModel.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Generated Output, Google Docs & Gmail Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Output Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[580px]">
            {/* Output Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 rounded-t-xl">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  {currentDraft ? 'Synthesis & Brainstorm Draft' : 'Workspace Ready'}
                </span>
                {generationSourceNotice && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {generationSourceNotice}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {currentDraft && (
                  <>
                    <button
                      onClick={handleCopyMarkdown}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                      title="Copy Markdown"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-teal-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadFile}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                      title="Download Markdown"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>.md</span>
                    </button>

                    {/* Google Docs Export Button */}
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-xs"
                      title="Export directly to Google Docs"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                      <span>Google Doc</span>
                    </button>

                    {/* Gmail Button */}
                    <button
                      onClick={handleOpenGmailModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs"
                      title="Send or draft research via Gmail"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Gmail</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Success Banner if exported to Google Docs */}
            {exportSuccessResult && (
              <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Exported to Google Docs:</span>{' '}
                    <span className="italic">{exportSuccessResult.title}</span>
                  </div>
                </div>
                <a
                  href={exportSuccessResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-md transition-colors shrink-0 text-xs shadow-xs"
                >
                  <span>Open in Google Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Success Banner if sent/drafted via Gmail */}
            {gmailSuccessResult && (
              <div className="mx-5 mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between gap-3 text-xs text-teal-900 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <span className="font-bold">
                      {gmailSuccessResult.mode === 'draft' ? 'Gmail Draft Saved:' : 'Gmail Sent Successfully:'}
                    </span>{' '}
                    <span>{gmailSuccessResult.mode === 'draft' ? 'Stored in your Gmail drafts folder' : `Dispatched to ${gmailSuccessResult.recipient}`}</span>
                  </div>
                </div>
                <a
                  href={gmailSuccessResult.mode === 'draft' ? 'https://mail.google.com/mail/u/0/#drafts' : 'https://mail.google.com/mail/u/0/#inbox'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-md transition-colors shrink-0 text-xs shadow-xs"
                >
                  <span>Open Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Error Banner with Quick Help Link */}
            {exportError && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-2 text-xs text-rose-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Notice:</span> {exportError}
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthHelpModal(true)}
                  className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-semibold rounded text-[11px] shrink-0 transition-colors"
                >
                  Fix This Issue
                </button>
              </div>
            )}

            {/* Output Body */}
            <div className="p-6 flex-1 flex flex-col overflow-y-auto">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                  <p className="text-sm font-semibold text-slate-700">
                    Consulting {selectedModel.toUpperCase()} Scientific Synthesis Engine...
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm text-center">
                    Formulating hypotheses, screening controls, and organizing structured experimental protocols.
                  </p>
                </div>
              ) : currentDraft ? (
                <div className="prose prose-sm max-w-none text-slate-800 font-sans leading-relaxed space-y-4">
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                    {currentDraft}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 py-16">
                  <Brain className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-600">No synthesis generated yet</p>
                  <p className="text-xs text-slate-400 max-w-md text-center">
                    Select a model persona (Gemini, ChatGPT, or Claude), attach relevant lab context, and click Generate to produce high-density amyloid drafts and export them to Google Docs or dispatch via Gmail.
                  </p>
                </div>
              )}
            </div>

            {/* Footer / Push to LabOS Actions */}
            {currentDraft && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-500 font-mono text-[11px]">
                  Draft Words: {currentDraft.split(/\s+/).filter(Boolean).length} | Characters: {currentDraft.length}
                </div>

                {onPushToPaperNotes && selectedPaperId && (
                  <button
                    onClick={() => onPushToPaperNotes(selectedPaperId, currentDraft)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-teal-700 hover:text-teal-900 bg-teal-50 border border-teal-200 rounded-md font-semibold hover:bg-teal-100 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Push to Selected Paper Notes</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Draft History Drawer */}
          {draftHistory.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Session Draft History ({draftHistory.length})
                </span>
                <span className="text-[11px] text-slate-400">Click to recall or compare</span>
              </div>

              <div className="space-y-2">
                {draftHistory.map((draft, idx) => (
                  <div
                    key={draft.id}
                    onClick={() => {
                      setCurrentDraft(draft.content);
                      setSelectedModel(draft.model);
                      setSelectedMode(draft.mode);
                      setDocTitleInput(draft.title);
                      setGmailSubject(`[Amyloid Lab] ${draft.title}`);
                      setActiveDraftIndex(idx);
                      setExportSuccessResult(draft.exportedDoc || null);
                      setGmailSuccessResult(
                        draft.gmailResult
                          ? { ...draft.gmailResult, mode: draft.gmailResult.isDraft ? 'draft' : 'send' }
                          : null
                      );
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      activeDraftIndex === idx
                        ? 'bg-teal-50 border-teal-500 text-slate-900 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                        draft.model === 'gemini' ? 'bg-teal-100 text-teal-800' :
                        draft.model === 'claude' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {draft.model}
                      </span>
                      <span className="truncate">{draft.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {draft.exportedDoc && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 font-medium">
                          <Check className="w-3 h-3" />
                          Doc Created
                        </span>
                      )}
                      {draft.gmailResult && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 font-medium">
                          <Mail className="w-3 h-3" />
                          {draft.gmailResult.isDraft ? 'Draft' : 'Sent'}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">{draft.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gmail Compose, Draft & Dispatch Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Send or Draft via Gmail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispatch research syntheses directly to collaborators or create a saved draft in your Gmail inbox.
                  </p>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setGmailMode('send')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    gmailMode === 'send'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Send className="w-3.5 h-3.5 text-rose-600" />
                    <span>Send Directly</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Dispatches email immediately to recipient
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGmailMode('draft')}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    gmailMode === 'draft'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    <span>Save to Drafts</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Creates an editable draft in your inbox
                  </div>
                </button>
              </div>

              {/* Sender & Recipient */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="font-medium">Sending From:</span>
                  <span className="font-semibold text-slate-800">
                    {currentUser?.email || 'Your Google Account'}
                  </span>
                </div>

                {gmailMode === 'send' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Recipient Email (To:) *
                    </label>
                    <input
                      type="email"
                      value={gmailRecipient}
                      onChange={e => setGmailRecipient(e.target.value)}
                      placeholder="e.g. pi@university.edu or colleague@lab.org"
                      className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={gmailSubject}
                    onChange={e => setGmailSubject(e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Optional Introductory Note
                  </label>
                  <textarea
                    value={gmailIntroNote}
                    onChange={e => setGmailIntroNote(e.target.value)}
                    placeholder="e.g. Dear Dr. Smith, please find the latest amyloid cross-seeding hypothesis synthesis attached below..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 max-h-32 overflow-y-auto space-y-1 font-mono">
                <span className="font-bold text-slate-700 font-sans block mb-1">Email Body Preview:</span>
                <p className="whitespace-pre-line text-slate-700">
                  {compileEmailBody().slice(0, 300)}...
                </p>
              </div>

              {/* Option A: 1-Click Instant Gmail Web (Zero permissions, no verification required) */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-xs text-rose-950">Instant Gmail Web Compose</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-200/90 text-rose-900 px-1.5 py-0.5 rounded">
                    Recommended · Instant
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 leading-snug">
                  Opens your logged-in Gmail with recipient, subject, and the synthesized research draft pre-filled in your compose box. Never blocked by Google OAuth verification!
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenGmailWeb}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Gmail Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyEmailContent}
                    className="py-2 px-3 bg-white hover:bg-rose-100/60 text-rose-900 border border-rose-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="Copy email subject and body to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenMailto}
                    className="py-2 px-3 bg-white hover:bg-rose-100/60 text-rose-900 border border-rose-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="Open in system default mail app (Outlook, Apple Mail, etc.)"
                  >
                    <span>Mail App</span>
                  </button>
                </div>
              </div>

              {/* Option B: Direct API Dispatch (Requires GCP Test User OAuth verification approval) */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Advanced: Direct API Dispatch (Background)</span>
                  <button
                    type="button"
                    onClick={() => setShowAuthHelpModal(true)}
                    className="text-teal-700 underline text-[11px] font-medium hover:text-teal-900 inline-flex items-center gap-0.5"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>OAuth Test User Guide</span>
                  </button>
                </div>

                {showSendConfirmation ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-fadeIn text-xs">
                    <div className="flex items-center gap-2 text-amber-900 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Confirm Sending Email via Gmail API</span>
                    </div>
                    <p className="text-amber-800 text-[11px]">
                      This action will dispatch an email directly through the Gmail API from <strong>{currentUser?.email}</strong> to <strong>{gmailRecipient}</strong>.
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowSendConfirmation(false)}
                        disabled={isSendingGmail}
                        className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteGmailAction}
                        disabled={isSendingGmail}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs flex items-center gap-1.5"
                      >
                        {isSendingGmail ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Yes, Dispatch via API</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setShowGmailModal(false)}
                      disabled={isSendingGmail}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Close
                    </button>

                    <button
                      onClick={() => {
                        if (gmailMode === 'send') {
                          if (!gmailRecipient.trim()) {
                            setExportError('Please enter a recipient email before sending.');
                            return;
                          }
                          setShowSendConfirmation(true);
                        } else {
                          handleExecuteGmailAction();
                        }
                      }}
                      disabled={isSendingGmail}
                      className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      {isSendingGmail ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : gmailMode === 'send' ? (
                        <>
                          <Send className="w-3 h-3" />
                          <span>Dispatch via Gmail API</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3" />
                          <span>Save to Drafts via API</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Export Modal for Google Docs */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Export to Google Docs
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a new document in your Google Drive with this research draft.
                  </p>
                </div>
              </div>

              {/* Document Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Google Document Title
                </label>
                <input
                  type="text"
                  value={docTitleInput}
                  onChange={e => setDocTitleInput(e.target.value)}
                  placeholder="Enter document title..."
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              {/* Info summary */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Target Service:</span>
                  <span className="font-semibold text-slate-800">Google Docs REST API</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Author / Account:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {currentUser?.displayName || currentUser?.email || 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Content Length:</span>
                  <span className="font-mono text-slate-800">{currentDraft.length} characters</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Model Attribution:</span>
                  <span className="font-semibold text-teal-700 uppercase">{selectedModel} ({selectedMode})</span>
                </div>
              </div>

              {/* Option A: Instant Google Docs (docs.new) - No OAuth verification needed */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-blue-950">Instant Google Docs (docs.new)</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-200/90 text-blue-900 px-1.5 py-0.5 rounded">
                    Recommended · Instant
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 leading-snug">
                  Copies this research draft to your clipboard and opens a brand new Google Doc in a new browser tab. Simply press <kbd className="px-1 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-mono">Ctrl+V</kbd> (or Cmd+V) to paste!
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenDocsNewWithClipboard}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Copy Draft & Open in Google Docs</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="py-2 px-3 bg-white hover:bg-blue-100/60 text-blue-900 border border-blue-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                    title="Download academic markdown file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.md</span>
                  </button>
                </div>
              </div>

              {/* Option B: Direct Google Docs REST API Export */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Advanced: Direct Google Docs REST API Export</span>
                  <button
                    type="button"
                    onClick={() => setShowAuthHelpModal(true)}
                    className="text-teal-700 underline text-[11px] font-medium hover:text-teal-900 inline-flex items-center gap-0.5"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>OAuth Guide</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setShowExportModal(false)}
                    disabled={isExporting}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>

                  {currentUser ? (
                    <button
                      onClick={handleConfirmGoogleDocExport}
                      disabled={isExporting}
                      className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating Document...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export via Google Docs API</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isSigningIn}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>Sign in with Google First</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Troubleshooting & Connection Helper Modal */}
      {showAuthHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Google & Firebase Connection Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quick solutions for &ldquo;Access blocked&rdquo; and &ldquo;auth/unauthorized-domain&rdquo; errors.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
              {/* Issue 1: Unauthorized Domain */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[11px]">
                    1
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">
                    Firebase: Error (auth/unauthorized-domain)
                  </h4>
                </div>
                <p className="text-slate-600">
                  Firebase Authentication restricts logins to verified domains. When opening the app on another device (laptop, tablet, phone) or a new preview URL, that domain must be registered in your Firebase project.
                </p>

                <div className="p-3 bg-white rounded-lg border border-slate-300 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block font-mono">Current Domain Hostname:</span>
                    <span className="font-mono font-bold text-xs text-slate-900 select-all">
                      {currentHostname}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCurrentDomain}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md shrink-0 text-xs shadow-xs transition-colors"
                  >
                    {domainCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Copy Domain</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 pl-2 text-slate-600 text-[11px]">
                  <div className="font-semibold text-slate-800">Quick 3-step fix (takes 30 seconds):</div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>
                      Open{' '}
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0951683292/authentication/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 underline font-semibold inline-flex items-center gap-0.5"
                      >
                        Firebase Authentication Settings <ExternalLink className="w-2.5 h-2.5" />
                      </a>{' '}
                      for project <strong>gen-lang-client-0951683292</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>Click the <strong>Authorized domains</strong> tab, then click <strong>Add domain</strong>.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>Paste your hostname (<code className="bg-slate-200 px-1 rounded">{currentHostname}</code>, or <code className="bg-slate-200 px-1 rounded">vercel.app</code> for Vercel apps) and click <strong>Add</strong>.</span>
                  </div>
                </div>
              </div>

              {/* Issue 2: Access Blocked / Google Verification */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">
                    &ldquo;Access blocked: has not completed Google verification&rdquo;
                  </h4>
                </div>
                <p className="text-slate-600">
                  During development, Google OAuth Consent is in <strong>Testing Mode</strong>. Only email accounts registered as &ldquo;Test Users&rdquo; in Google Cloud Console can sign in.
                </p>

                <div className="space-y-1.5 pl-2 text-slate-600 text-[11px]">
                  <div className="font-semibold text-slate-800">Quick 3-step fix:</div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-700 font-bold">•</span>
                    <span>
                      Open{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials/consent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline font-semibold inline-flex items-center gap-0.5"
                      >
                        Google Cloud OAuth Consent Screen <ExternalLink className="w-2.5 h-2.5" />
                      </a>{' '}
                      (Project: <strong>gen-lang-client-0951683292</strong>).
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-700 font-bold">•</span>
                    <span>
                      Scroll to <strong>Test users</strong> &gt; click <strong>+ ADD USERS</strong> &gt; enter your email (<code>sumaiya.islam.amy@g.bracu.ac.bd</code>) &gt; click <strong>Save</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-blue-700 font-bold">•</span>
                    <span>
                      When signing in, if a warning screen shows <em>&ldquo;Google hasn&apos;t verified this app&rdquo;</em>, click <strong>Advanced</strong> (bottom-left) &gt; <strong>Go to gen-lang-client-0951683292.firebaseapp.com (unsafe)</strong> &gt; <strong>Continue</strong>.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Once authorized, click Sign In above to connect.
              </span>
              <button
                onClick={() => setShowAuthHelpModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restart Ideas & Start Afresh Modal */}
      <RestartConfirmModal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        onConfirmRestartAll={handleRestartAllIdeas}
        onConfirmResetScratchpad={handleResetEditorOnly}
        ideasCount={draftHistory.length}
      />

      {/* Floating Session Feedback Toast */}
      {sessionNotice && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>{sessionNotice}</span>
        </div>
      )}
    </div>
  );
};
