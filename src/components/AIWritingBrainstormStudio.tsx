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
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ResearchPaper, Protocol, TargetOutcomeRecord, BioinformaticsPipelineRun } from '../types';
import { initAuth, googleSignIn, logout, getAccessToken } from '../services/authService';
import { exportToGoogleDoc, GoogleDocExportResult } from '../services/googleDocsService';

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
  onNavigateToPaper?: (paperId: string) => void;
  onNavigateToProtocol?: (protocolId: string) => void;
  onPushToPaperNotes?: (paperId: string, synthesisText: string) => void;
}

interface GeneratedDraft {
  id: string;
  title: string;
  content: string;
  model: AIModelPersona;
  mode: WritingMode;
  createdAt: string;
  exportedDoc?: GoogleDocExportResult;
}

const PROMPT_SUGGESTIONS: { label: string; mode: WritingMode; model: AIModelPersona; prompt: string }[] = [
  {
    label: 'Hypothesis: CRISPR Cleavage & Off-Targets',
    mode: 'hypothesis',
    model: 'gemini',
    prompt: 'Propose a testable hypothesis regarding whether SpCas9 vs Cas12a exhibits differential fidelity in high GC-content promoter regions (>65% GC), and outline an orthogonal assay matrix (SPR, in vitro cleavage, and RNA-seq) with positive and negative controls.'
  },
  {
    label: 'Protocol: RNA Extraction A260/230 Troubleshoot',
    mode: 'protocol_troubleshoot',
    model: 'chatgpt',
    prompt: 'Our Trizol RNA extraction yielded high concentration (450 ng/µL) but low A260/230 ratio (1.25), while A260/280 was 1.95. Diagnose chemical contamination sources and provide a strict protocol optimization checklist to reach A260/230 > 2.0 without sacrificing yield.'
  },
  {
    label: 'Grant: NIH Specific Aims for Drug Resistance',
    mode: 'aim_grant',
    model: 'claude',
    prompt: 'Draft an NIH-style Specific Aim 1 (Mechanistic Binding and Kinetics) and Specific Aim 2 (RNA-Seq Transcriptomic Profiling & Phenotypic Validation) addressing adaptive drug tolerance in targeted therapy.'
  },
  {
    label: 'Abstract & Discussion: Cas9 Ribonucleoprotein Delivery',
    mode: 'abstract_discussion',
    model: 'gemini',
    prompt: 'Co-author a high-impact abstract and discussion section highlighting how direct electroporation of Cas9 RNPs circumvents persistent viral expression and suppresses off-target translocations.'
  }
];

export const AIWritingBrainstormStudio: React.FC<AIWritingBrainstormStudioProps> = ({
  papers,
  protocols,
  targetOutcomes,
  pipelineRuns,
  onPushToPaperNotes
}) => {
  // Model selection
  const [selectedModel, setSelectedModel] = useState<AIModelPersona>('gemini');
  const [selectedMode, setSelectedMode] = useState<WritingMode>('hypothesis');

  // Input state
  const [promptInput, setPromptInput] = useState<string>('');
  const [docTitleInput, setDocTitleInput] = useState<string>('BioSynth Research Synthesis');

  // Context Injection selection
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('');
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const [draftHistory, setDraftHistory] = useState<GeneratedDraft[]>([]);
  const [activeDraftIndex, setActiveDraftIndex] = useState<number>(-1);
  const [generationSourceNotice, setGenerationSourceNotice] = useState<string>('');

  // Google OAuth & Docs Export state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessResult, setExportSuccessResult] = useState<GoogleDocExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

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
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setExportError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setExportSuccessResult(null);
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
    setExportError(null);

    const contextData = compileContextData();

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

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const generatedResult = data.text || 'No generation returned.';

      setCurrentDraft(generatedResult);
      setGenerationSourceNotice(data.source || (data.isFallback ? 'BioSynth Scientific Synthesis Engine' : 'AI Model'));

      // Automatically construct a suggested Google Doc title
      let generatedDocTitle = 'BioSynth Research Synthesis';
      if (textToRun.length > 0) {
        generatedDocTitle = `${selectedModel.toUpperCase()}: ${textToRun.slice(0, 40).replace(/[^a-zA-Z0-9 ]/g, '')}...`;
      }
      setDocTitleInput(generatedDocTitle);

      const newDraftItem: GeneratedDraft = {
        id: `draft-${Date.now()}`,
        title: generatedDocTitle,
        content: generatedResult,
        model: selectedModel,
        mode: selectedMode,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setDraftHistory(prev => [newDraftItem, ...prev]);
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

    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }

    if (!token) {
      setShowExportModal(false);
      setExportError('Please sign in with Google to export to Google Docs.');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const result = await exportToGoogleDoc(
        {
          title: docTitleInput.trim() || `BioSynth LabOS Research - ${new Date().toISOString().split('T')[0]}`,
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
      setExportError(err.message || 'Google Docs export failed. Please verify permissions.');
    } finally {
      setIsExporting(false);
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

  const activeContextCount = [selectedPaperId, selectedProtocolId, selectedOutcomeId, selectedRunId].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Multi-Model Lab Co-Author
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <FileText className="w-3.5 h-3.5" />
                Google Docs Direct Export
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              AI Scientific Writing & Brainstorm Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Co-author high-impact research hypotheses, experimental matrices, and grant aims using specialized Gemini, ChatGPT, and Claude personas with direct one-click Google Docs export.
            </p>
          </div>

          {/* Google Account Connection Status */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-teal-400"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center font-bold text-xs text-white">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-[10px] text-teal-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Google Docs Connected
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  title="Disconnect Google"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Google Material Design Styled Sign-in Button compliant with Skill */
              <button
                onClick={handleGoogleLogin}
                disabled={isSigningIn}
                className="inline-flex items-center gap-2.5 px-4 py-2 bg-white text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-lg shadow-sm border border-slate-300 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
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
              Deeply grounded scientific reasoning, molecular biology literature, and computational equations.
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
              Critical peer review, methodological scrutiny, nuance in epistemic claims, and grant aim tension.
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
              Structured protocols, actionable bench checklists, parameter matrices, and execution roadmaps.
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
              Quick Research Starters
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
              placeholder="e.g. Formulate an experimental matrix to test Cas9 vs Cas12a off-target cleavage in GC-rich promoters with negative controls..."
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

        {/* Right Column: Generated Output, Google Docs Export & History (7 cols) */}
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
              <div className="flex items-center gap-2">
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
                      <span>Export to Google Doc</span>
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

            {/* Error Banner */}
            {exportError && (
              <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Notice:</span> {exportError}
                </div>
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
                    Select a model persona (Gemini, ChatGPT, or Claude), attach relevant lab context, and click Generate to produce high-density scientific drafts and export them directly to Google Docs.
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
                      setActiveDraftIndex(idx);
                      if (draft.exportedDoc) {
                        setExportSuccessResult(draft.exportedDoc);
                      } else {
                        setExportSuccessResult(null);
                      }
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
                      <span className="text-[10px] text-slate-400 font-mono">{draft.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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

              {!currentUser && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    You must sign in with Google first to authorize exporting to your Google Docs.
                  </span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowExportModal(false)}
                  disabled={isExporting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                {currentUser ? (
                  <button
                    onClick={handleConfirmGoogleDocExport}
                    disabled={isExporting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating Document...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Confirm & Export</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSigningIn}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <span>Sign in with Google First</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
