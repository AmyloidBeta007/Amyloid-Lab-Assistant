import React, { useState } from 'react';
import {
  Terminal, Play, Copy, Check, ExternalLink, Dna,
  Layers, BarChart3, Database, ArrowRight, Sparkles, Filter,
  Share2, FileCode, CheckCircle2, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import {
  BioinformaticsPipelineRun, ResearchPaper, Protocol,
  TargetOutcomeRecord, DiscardType, SequenceAnalysisResult
} from '../types';
import { analyzeSequence, formatTimeSeconds } from '../utils/bioMath';
import { DiscardButton } from './DiscardButton';

interface BioinformaticsStudioProps {
  pipelineRuns: BioinformaticsPipelineRun[];
  papers: ResearchPaper[];
  protocols: Protocol[];
  targetOutcomes: TargetOutcomeRecord[];
  onAddPipelineRun: (run: BioinformaticsPipelineRun) => void;
  onUpdatePipelineRun: (run: BioinformaticsPipelineRun) => void;
  onDiscardPipelineRun: (id: string, type: DiscardType) => void;
  onPushFigureToPaper: (paperId: string, title: string, imageUrl: string, notes: string) => void;
  onPushOutcomeToMatrix: (record: TargetOutcomeRecord) => void;
  onNavigateToPaper: (paperId: string) => void;
  onNavigateToProtocol: (protocolId: string) => void;
}

type BioinfoSubTab = 'pipelines' | 'sequence_sandbox' | 'volcano_qc';

const PRESET_SEQUENCES: Array<{ name: string; type: string; seq: string; notes: string }> = [
  {
    name: 'SpCas9 sgRNA Locus (EMX1 Exon 3)',
    type: 'Target Protospacer + PAM',
    seq: 'GAGTCCGAGCAGAAGAAGAAGGGCTCCCATCACATCAACCGGTGGCGCATTGCCACGAAGCAGGCCAATGGGGAGGACATCGATGTCACCTCCAATGACTAGGGTGGGCAACCAC',
    notes: 'Canonical human EMX1 locus cut site 3 bp upstream of AGG PAM.'
  },
  {
    name: 'BCL11A Enhancer GATA1 Motif',
    type: 'Core Erythroid Enhancer',
    seq: 'CTAACAGTTGCTTTTATCACAGATGACCTGGTGAGTCCCCTCTTTTCCACTTTAACAGGGACCCAGGG',
    notes: 'Disruption of the GATA1 binding site reactivates fetal hemoglobin (HbF).'
  },
  {
    name: 'Restriction Cloning Linker (EcoRI + BamHI)',
    type: 'Polylinker',
    seq: 'GGAATTCGCGGCCGCGGATCCAAGCTTGGTACCGAGCTCGGATCC',
    notes: 'Multiple cloning site harboring EcoRI, NotI, BamHI, and HindIII sites.'
  },
  {
    name: 'LacZ Minimal Alpha Peptide CDS',
    type: 'Bacterial Marker',
    seq: 'ATGACCATGATTACGCCAAGCTTGGCTGCAGGTCGACTCTAGAGGATCCCCGGGTACCGAGCTCGAATTCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGCGCTTTGCCTGGTTTCCGGCACCAGAAGCGGTGCCGGAAAGCTGGCTGGAGTGCGATCTTCCTGAGGCCGATACTGTCGTCGTCCCCTCAAACTGGCAGATGCACGGTTACGATGCGCCCATCTACACCAACGTGACCTATCCCATTACGGTCAATCCGCCGTTTGTTCCCACGGAGAATCCGACGGGTTGTTACTCGCTCACATTTAATGTTGATGAAAGCTGGCTACAGGAAGGCCAGACGCGAATTATTTTTGATGGCGTTAACTCGGCGTTTCATCTGTGGTGCAACGGGCGCTGGGTCGGTTACGGCCAGGACAGTCGTTTGCCGTCTGAATTTGACCTGAGCGCATTTTTACGCGCCGGAGAAAACCGCCTCGCGGTGATGGTGCTGCGCTGGAGTGACGGCAGTTATCTGGAAGATCAGGATATGTGGCGGATGAGCGGCATTTTCCGTGACGTCTCGTTGCTGCATAAACCGACTACACAAATCAGCGATTTCCATGTTGCCACTCGCTTTAATGATGATTTCAGCCGCGCTGTACTGGAGGCTGAAGTTCAGATGTGCGGCGAGTTGCGTGACTACCTACGGGTAACAGTTTCTTTATGGCAGGGTGAAACGCAGGTCGCCAGCGGCACCGCGCCTTTCGGCGGTGAAATTATCGATGAGCGTGGTGGTTATGCCGATCGCGTCACACTACGTCTGAACGTCGAAAACCCGAAACTGTGGAGCGCCGAAATCCCGAATCTCTATCGTGCGGTGGTTGAACTGCACACCGCCGACGGCACGCTGATTGAAGCAGAAGCCTGCGATGTCGGTTTCCGCGAGGTGCGGATTGAAAATGGTCTGCTGCTGCTGAACGGCAAGCCGTTGCTGATTCGAGGCGTTAACCGTCACGAGCATCATCCTCTGCATGGTCAGGTCATGGATGAGCAGACGATGGTGCAGGATATCCTGCTGATGAAGCAGAACAACTTTAACGCCGTGCGCTGTTCGCATTATCCGAACCATCCGCTGTGGTACACGCTGTGCGACCGCTACGGCCTGTATGTGGTGGATGAAGCCAATATTGAAACCCACGGCATGGTGCCAATGAATCGTCTGACCGATGATCCGCGCTGGCTACCGGCGATGAGCGAACGCGTAACGCGAATGGTGCAGCGCGATCGTAATCACCCGAGTGTGATCATCTGGTCGCTGGGGAATGAATCAGGCCACGGCGCTAATCACGACGCGCTGTATCGCTGGATCAAATCTGTCGATCCTTCCCGCCCGGTGCAGTATGAAGGCGGCGGAGCCGACACCACGGCCACCGATATTATTTGCCCGATGTACGCGCGCGTGGATGAAGACCAGCCCTTCCCGGCTGTGCCGAAATGGTCCATCAAAAAATGGCTTTCGCTACCTGGAGAGACGCGCCCGCTGATCCTTTGCGAATACGCCCACGCGATGGGTAACAGTCTTGGCGGTTTCGCTAAATACTGGCAGGCGTTTCGTCAGTATCCCCGTTTACAGGGCGGCTTCGTCTGGGACTGGGTGGATCAGTCGCTGATTAAATATGATGAAAACGGCAACCCGTGGTCGGCTTACGGCGGTGATTTTGGCGATACGCCGAACGATCGCCAGTTCTGTATGAACGGTCTGGTCTTTGCCGACCGCACGCCGCATCCAGCGCTGACGGAAGCAAAACACCAGCAGCAGTTTTTCCAGTTCCGTTTATCCGGGCAAACCATCGAAGTGACCAGCGAATACCTGTTCCGTCATAGCGATAACGAGCTCCTGCACTGGATGGTGGCGCTGGATGGTAAGCCGCTGGCAAGCGGTGAAGTGCCTCTGGATGTCGCTCCACAAGGTAAACAGTTGATTGAACTGCCTGAACTACCGCAGCCGGAGAGCGCCGGGCAACTCTGGCTCACAGTACGCGTAGTGCAACCGAACGCGACCGCATGGTCAGAAGCCGGGCACATCAGCGCCTGGCAGCAGTGGCGTCTGGCGGAAAACCTCAGTGTGACGCTCCCCGCCGCGTCCCACGCCATCCCGCATCTGACCACCAGCGAAATGGATTTTTGCATCGAGCTGGGTAATAAGCGTTGGCAATTTAACCGCCAGTCAGGCTTTCTTTCACAGATGTGGATTGGCGATAAAAAACAACTGCTGACGCCGCTGCGCGATCAGTTCACCCGTGCACCGCTGGATAACGACATTGGCGTAAGTGAAGCGACCCGCATTGACCCTAACGCCTGGGTCGAACGCTGGAAGGCGGCGGGCCATTACCAGGCCGAAGCAGCGTTGTTGCAGTGCACGGCAGATACACTTGCTGATGCGGTGCTGATTACGACCGCTCACGCGTGGCAGCATCAGGGGAAAACCTTATTTATCAGCCGGAAAACCTACCGGATTGATGGTAGTGGTCAAATGGCGATTACCGTTGATGTTGAAGTGGCGAGCGATACACCGCATCCGGCGCGGATTGGCCTGAACTGCCAGCTGGCGCAGGTAGCAGAGCGGGTAAACTGGCTCGGATTAGGGCCGCAAGAAAACTATCCCGACCGCCTTACTGCCGCCTGTTTTGACCGCTGGGATCTGCCATTGTCAGACATGTATACCCCGTACGTCTTCCCGAGCGAAAACGGTCTGCGCTGCGGGACGCGCGAATTGAATTATGGCCCACACCAGTGGCGCGGCGACTTCCAGTTCAACATCAGCCGCTACAGTCAACAGCAACTGATGGAAACCAGCCATCGCCATCTGCTGCACGCGGAAGAAGGCACATGGCTGAATATCGACGGTTTCCATATGGGGATTGGTGGCGACGACTCCTGGAGCCCGTCAGTATCGGCGGAATTCCAGCTGAGCGCCGGTCGCTACCATTACCAGTTGGTCTGGTGTCAAAAATAATAATAACCGGGCAGGCCATGTCTGCCCGTATTTCGCGTAAGGAAATCCATTATGTACTATTTAAAAAACACAAACTTTTGGATGTTCGGTTTATTCTTTTTCTTTTACTTTTTTATCATGGGAGCCTACTTCCCGTTTTTCCCGATTTGGCTACATGACATCAACCATATCAGCAAAAGTGATACGGGTATTATTTTTGCCGCTATTTCTCTGTTCTCGCTATTATTCCAACCGCTGTTTGGTCTGCTTTCTGACAAACTCGGGCTGCGCAAATACCTGCTGTGGATTATTACCGGCATGTTAGTGATGTTTGCGCCGTTCTTTATTTTTATCTTCGGGCCACTGTTACAATACAACATTTTAGTAGGATCGATTGTTGGTGGTATTTATCTAGGCTTTTGTTTTAACGCCGGTGCGCCAGCAGTAGAGGCATTTATTGAGAAAGTCAGCCGTCGCAGTAATTTCGAATTTGGTCGCGCGCGGATGTTTGGCTGTGTTGGCTGGGCGCTGTGTGCCTCGATTGTCGGCATCATGTTCACCATCAATAATCAGTTTGTTTTCTGGCTGGGCTCTGGCTGTGCACTCATCCTCGCCGTTTTACTCTTTTTCGCCAAAACGGATGCGCCCTCTTCTGCCACGGTTGCCAATGCGGTAGGTGCCAACCATTCGGCATTTAGCCTTAAGCTGGCACTGGAACTGTTCAGACAGCCAAAACTGTGGTTTTTGTCACTGTATGTTATTGGCGTTTCCTGCACCTACGATGTTTTTGACCAACAGTTTGCTAATTTCTTTACTTCGTTCTTTGCTACCGGTGAACAGGGTACGCGGGTATTTGGCTACGTAACGACAATGGGCGAATTACTTAACGCCTCGATTATGTTCTTTGCGCCACTGATCATTAATCGCATCGGTGGGAAAAACGCCCTGCTGCTGGCTGGCACTATTATGTCTGTACGTATTATTGGCTCATCGTTCGCCACCTCAGCGCTGGAAGTGGTTATTCTGAAAACGCTGCATATGTTTGAAGTACCGTTCCTGCTGGTGGGCTGCTTTAAATATATTACCAGCCAGTTTGAAGTGCGTTTTTCAGCGACGATTTATCTGGTCTGTTTCTGCTTCTTTAAGCAACTGGCGATGATTTTTATGTCTGTACTGGCGGGCAATATGTATGAAAGCATCGGTTTCCAGGGCGCTTATCTGGTGCTGGGTCTGGTGGCGCTGGGCTTCACCTTAATTTCCGTGTTCACGCTTAGCGGCCCCGGCCCGCTTTCCCTGCTGCGTCGTCAGGTGAATGAAGTCGCTTAA',
    notes: 'Classic 3.0 kb beta-galactosidase gene with full enzymatic active sites.'
  }
];

// Sample Volcano Plot Genes for interactive scatter plot
const SAMPLE_VOLCANO_GENES = [
  { gene: 'CDKN1A', log2fc: 3.42, negLogP: 8.4, status: 'up', desc: 'p21 cyclin-dependent kinase inhibitor (p53 target)' },
  { gene: 'BAX', log2fc: 2.85, negLogP: 6.9, status: 'up', desc: 'Pro-apoptotic BCL-2 family member' },
  { gene: 'MDM2', log2fc: 2.12, negLogP: 5.7, status: 'up', desc: 'E3 ubiquitin-protein ligase' },
  { gene: 'GADD45A', log2fc: 1.95, negLogP: 4.8, status: 'up', desc: 'DNA damage response checkpoint' },
  { gene: 'PUMA', log2fc: 2.61, negLogP: 6.1, status: 'up', desc: 'BBC3 / p53 upregulated mediator of apoptosis' },
  { gene: 'BCL11A', log2fc: -3.85, negLogP: 9.2, status: 'down', desc: 'Target transcription factor repressed' },
  { gene: 'MYC', log2fc: -2.31, negLogP: 5.4, status: 'down', desc: 'Proto-oncogene cellular transcription factor' },
  { gene: 'CCND1', log2fc: -1.82, negLogP: 4.2, status: 'down', desc: 'Cyclin D1 cell cycle regulator' },
  { gene: 'SOX2', log2fc: -2.74, negLogP: 7.1, status: 'down', desc: 'Stemness / pluripotency regulator' },
  { gene: 'ACTB', log2fc: 0.12, negLogP: 0.4, status: 'ns', desc: 'Housekeeping beta-actin' },
  { gene: 'GAPDH', log2fc: -0.08, negLogP: 0.3, status: 'ns', desc: 'Glyceraldehyde-3-phosphate dehydrogenase' },
  { gene: 'HPRT1', log2fc: 0.15, negLogP: 0.6, status: 'ns', desc: 'Hypoxanthine phosphoribosyltransferase' }
];

export const BioinformaticsStudio: React.FC<BioinformaticsStudioProps> = ({
  pipelineRuns,
  papers,
  protocols,
  targetOutcomes,
  onAddPipelineRun,
  onUpdatePipelineRun,
  onDiscardPipelineRun,
  onPushFigureToPaper,
  onPushOutcomeToMatrix,
  onNavigateToPaper,
  onNavigateToProtocol
}) => {
  const [subTab, setSubTab] = useState<BioinfoSubTab>('pipelines');
  const [selectedRunId, setSelectedRunId] = useState<string>(pipelineRuns[0]?.id || 'run-rnaseq-01');
  const [copiedCommandIdx, setCopiedCommandIdx] = useState<number | null>(null);

  // In-Silico Sequence Sandbox State
  const [sequenceInput, setSequenceInput] = useState<string>(PRESET_SEQUENCES[0].seq);
  const [activeAnalysis, setActiveAnalysis] = useState<SequenceAnalysisResult>(() =>
    analyzeSequence(PRESET_SEQUENCES[0].seq)
  );
  const [copiedSeqNote, setCopiedSeqNote] = useState(false);

  // Simulation execution state
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  // Volcano plot state
  const [hoveredGene, setHoveredGene] = useState<typeof SAMPLE_VOLCANO_GENES[0] | null>(null);
  const [volcanoFcCutoff, setVolcanoFcCutoff] = useState<number>(1.5);
  const [volcanoPCutoff, setVolcanoPCutoff] = useState<number>(4.0);
  const [pushStatusMessage, setPushStatusMessage] = useState<string | null>(null);

  const currentRun = pipelineRuns.find(r => r.id === selectedRunId) || pipelineRuns[0];
  const linkedPaper = papers.find(p => p.id === currentRun?.linkedWetLabPaperId);
  const linkedProtocol = protocols.find(p => p.id === currentRun?.linkedWetLabProtocolId);

  const handleSequenceChange = (newSeq: string) => {
    setSequenceInput(newSeq);
    setActiveAnalysis(analyzeSequence(newSeq));
  };

  const handleLoadPreset = (preset: typeof PRESET_SEQUENCES[0]) => {
    setSequenceInput(preset.seq);
    setActiveAnalysis(analyzeSequence(preset.seq));
  };

  const handleSimulateExecution = () => {
    setIsSimulatingRun(true);
    setSimulationLogs(['[00:00:01] Initializing Docker container: biocontainers/star:2.7.10b...']);

    setTimeout(() => {
      setSimulationLogs(prev => [...prev, '[00:00:04] FASTQ pair validation passed. Q30 percentage = 96.4%.']);
    }, 700);

    setTimeout(() => {
      setSimulationLogs(prev => [...prev, '[00:00:09] STAR genome index loaded into shared memory (32.1 GB).']);
    }, 1400);

    setTimeout(() => {
      setSimulationLogs(prev => [
        ...prev,
        '[00:00:15] Aligning reads: 42,810,490 processed, 94.6% uniquely mapped.',
        '[00:00:19] Running DESeq2 negative binomial dispersion shrinkage in R...',
        '[00:00:23] SUCCESS: Pipeline finished with exit code 0. Generated 1,482 DEGs.'
      ]);
      setIsSimulatingRun(false);
    }, 2200);
  };

  const handlePushVolcanoToPaper = (paperId: string) => {
    const targetPaper = papers.find(p => p.id === paperId) || papers[0];
    if (!targetPaper) return;

    onPushFigureToPaper(
      targetPaper.id,
      `RNA-Seq Volcano Plot (${currentRun?.sampleId || 'CRISPR KO'})`,
      currentRun?.plotImage || '/src/assets/images/rna_seq_flow_visual_1792938142351.jpg',
      `Differential gene expression volcano plot generated via STAR + DESeq2. FC cutoff = ±${volcanoFcCutoff}, -log10 p-adj = ${volcanoPCutoff}. Key induced hits: CDKN1A, BAX. Repressed: BCL11A.`
    );

    setPushStatusMessage(`Attached Volcano Plot to paper: "${targetPaper.title.slice(0, 40)}..."`);
    setTimeout(() => setPushStatusMessage(null), 3500);
  };

  const handlePushToTargetOutcomes = () => {
    const newRecord: TargetOutcomeRecord = {
      id: `record-bio-${Date.now()}`,
      targetObjective: `Bioinformatic Validation: ${currentRun?.pipelineName || 'RNA-seq'}`,
      hypothesis: `Target knock-down will trigger downstream transcriptional changes in canonical pathway.`,
      linkedProtocolId: currentRun?.linkedWetLabProtocolId,
      linkedPaperIds: currentRun?.linkedWetLabPaperId ? [currentRun.linkedWetLabPaperId] : [],
      status: 'Achieved',
      empiricalOutcome: `${currentRun?.summaryOutput.mappingRate || '94.6% mapping'}. Identified ${currentRun?.summaryOutput.significantHits || 1482} significant differentially expressed genes.`,
      shortcomingsAndPitfalls: [
        'Single-end verification required for ambiguous splice junctions.',
        'Batch effect correction with ComBat-seq is advised for repeat replicates.'
      ],
      nextIterationAdjustment: 'Filter unmapped reads and re-run with relaxed mismatch tolerance for novel transcript isoforms.',
      dateLogged: new Date().toISOString().split('T')[0],
      sampleBatch: currentRun?.sampleId
    };

    onPushOutcomeToMatrix(newRecord);
    setPushStatusMessage(`Pushed bioinformatics result directly to Targets & Outcomes Matrix!`);
    setTimeout(() => setPushStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Bioinfo Command Deck Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-white p-6 sm:p-8">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <img
            src="/src/assets/images/rna_seq_flow_visual_1792938142351.jpg"
            alt="Bioinformatics Matrix"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>DRY LAB STUDIO</span>
            <span aria-hidden="true">·</span>
            <span>IN-SILICO GENOMICS & BIOINFORMATICS WORKBENCH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Separated Dry Lab Power with Instant Wet Lab Connectivity
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Execute sequencing pipelines, analyze nucleotide sequences in-silico, inspect differential expression volcano plots, and seamlessly link data to wet lab bench protocols.
          </p>

          {/* Connected Wet Lab Docking Bridge */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono text-slate-400 uppercase tracking-wider text-[11px]">
              Active Wet Lab Bridge:
            </span>

            {linkedPaper ? (
              <button
                type="button"
                onClick={() => onNavigateToPaper(linkedPaper.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-teal-500/50 text-teal-300 hover:text-white rounded-lg transition-colors"
                title="Jump to linked research paper dossier"
              >
                <span>Paper: {linkedPaper.authors.split(',')[0]} ({linkedPaper.year})</span>
                <ExternalLink className="w-3 h-3 text-teal-400" />
              </button>
            ) : (
              <span className="text-slate-500 italic">No paper linked</span>
            )}

            {linkedProtocol ? (
              <button
                type="button"
                onClick={() => onNavigateToProtocol(linkedProtocol.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-cyan-500/50 text-cyan-300 hover:text-white rounded-lg transition-colors"
                title="Jump to wet bench protocol"
              >
                <span>Protocol: {linkedProtocol.title}</span>
                <ExternalLink className="w-3 h-3 text-cyan-400" />
              </button>
            ) : null}

            {/* Quick Actions to push data to wet lab */}
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handlePushToTargetOutcomes}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Push Result to Wet Lab Targets</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Push Status Toast */}
      {pushStatusMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-semibold rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pushStatusMessage}</span>
          </div>
          <button
            onClick={() => setPushStatusMessage(null)}
            className="text-emerald-400 hover:text-white text-base leading-none px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Sub-Studio Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('pipelines')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'pipelines'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Pipeline Orchestrator & CLI ({pipelineRuns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('sequence_sandbox')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'sequence_sandbox'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Dna className="w-4 h-4 text-cyan-400" />
          <span>In-Silico Sequence Sandbox</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('volcano_qc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'volcano_qc'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-rose-400" />
          <span>Volcano Plot & DEG Inspector</span>
        </button>
      </div>

      {/* TAB 1: PIPELINE ORCHESTRATOR */}
      {subTab === 'pipelines' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: List of Pipelines */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Pipeline Runs Ledger
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {pipelineRuns.length} Active Runs
              </span>
            </div>

            <div className="space-y-2">
              {pipelineRuns.map(run => {
                const isSelected = run.id === selectedRunId;
                return (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 relative group ${
                      isSelected
                        ? 'bg-slate-950 text-white border-slate-800 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          isSelected ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {run.category}
                        </span>
                        <h4 className="font-bold text-xs truncate mt-1">{run.pipelineName}</h4>
                      </div>

                      {/* Discard Button (Wet vs Dry Discard) */}
                      <div onClick={e => e.stopPropagation()}>
                        <DiscardButton
                          onDiscard={type => onDiscardPipelineRun(run.id, type)}
                          size="sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-200/40">
                      <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                        {run.sampleId}
                      </span>
                      <span className={isSelected ? 'text-emerald-400' : 'text-emerald-700 font-semibold'}>
                        {run.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Pipeline Execution & Script Inspector */}
          {currentRun && (
            <div className="lg:col-span-8 bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Header and Discard Options */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {currentRun.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Run Date: {currentRun.dateRun}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-white">
                    {currentRun.pipelineName}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Sample: <span className="text-cyan-300">{currentRun.sampleId}</span> · Reference: {currentRun.referenceGenome}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateExecution}
                    disabled={isSimulatingRun}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isSimulatingRun ? 'Executing Pipeline...' : 'Run Simulation'}</span>
                  </button>

                  <DiscardButton
                    onDiscard={type => onDiscardPipelineRun(currentRun.id, type)}
                    size="md"
                    variant="outline"
                  />
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Total Reads</span>
                  <p className="text-sm font-bold text-white">{currentRun.summaryOutput.totalReads || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Mapping Rate</span>
                  <p className="text-sm font-bold text-cyan-300">{currentRun.summaryOutput.mappingRate || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Sig. Features</span>
                  <p className="text-sm font-bold text-emerald-400">{currentRun.summaryOutput.significantHits || 0}</p>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase">Phred Quality</span>
                  <p className="text-sm font-bold text-amber-300">{currentRun.summaryOutput.q30Percent ? `Q30 > ${currentRun.summaryOutput.q30Percent}%` : 'Q30 Valid'}</p>
                </div>
              </div>

              {/* Execution Log Stream */}
              {simulationLogs.length > 0 && (
                <div className="p-4 bg-black border border-emerald-900/60 rounded-xl font-mono text-xs text-emerald-400 space-y-1 max-h-48 overflow-y-auto">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>LIVE SIMULATED RUN LOG</span>
                    {isSimulatingRun && <span className="animate-pulse text-emerald-400">● EXEC</span>}
                  </div>
                  {simulationLogs.map((line, idx) => (
                    <div key={idx} className="leading-relaxed">{line}</div>
                  ))}
                </div>
              )}

              {/* Generated CLI Commands with One-Click Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Reproducible Pipeline Script (Bash / Nextflow)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentRun.generatedCommands.join('\n'));
                      setCopiedCommandIdx(-1);
                      setTimeout(() => setCopiedCommandIdx(null), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    {copiedCommandIdx === -1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCommandIdx === -1 ? 'Copied Full Script' : 'Copy All Commands'}</span>
                  </button>
                </div>

                <div className="bg-black border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-2 text-slate-300">
                  {currentRun.generatedCommands.map((cmd, i) => (
                    <div key={i} className="group relative">
                      <pre className={`whitespace-pre-wrap ${cmd.startsWith('#') ? 'text-slate-500 italic' : 'text-emerald-300 font-semibold'}`}>
                        {cmd}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Wet Lab Bridge Box */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-white">Cross-Link Pipeline to Wet Lab Dossier</h4>
                  <p className="text-[11px] text-slate-400">
                    Sync this computational run with your wet bench experiment records or paper citations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePushVolcanoToPaper(papers[0]?.id || '')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    Send Figure to Paper
                  </button>
                  <button
                    type="button"
                    onClick={handlePushToTargetOutcomes}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Send to Targets
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IN-SILICO SEQUENCE SANDBOX */}
      {subTab === 'sequence_sandbox' && (
        <div className="space-y-6">
          {/* Presets Strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Quick Load Biological Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SEQUENCES.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleLoadPreset(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 transition-colors"
                >
                  {p.name} ({p.type})
                </button>
              ))}
            </div>
          </div>

          {/* Main Sequence Input and Visual Analyzer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Textarea */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono text-cyan-400">DNA / RNA RAW SEQUENCE INPUT</span>
                <span className="text-xs font-mono text-slate-400">
                  {activeAnalysis.length} bp / nucleotides
                </span>
              </div>

              <textarea
                value={sequenceInput}
                onChange={e => handleSequenceChange(e.target.value)}
                placeholder="Paste FASTA or raw DNA sequence (A, T, G, C)..."
                rows={8}
                className="w-full text-xs font-mono p-3 bg-black border border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 tracking-wider leading-relaxed uppercase"
              />

              {/* Color-Coded Nucleotide Legend */}
              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> A (Adenine)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span> T (Thymine)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> G (Guanine)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-500 inline-block"></span> C (Cytosine)</span>
              </div>
            </div>

            {/* Right: Instant In-Silico Metrics */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                  Biophysical & Thermodynamic Properties
                </h3>
                <span className="text-xs font-mono font-bold text-teal-700">
                  GC Content: {activeAnalysis.gcContentPercent}%
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Length</span>
                  <p className="text-sm font-bold text-slate-900">{activeAnalysis.length} bp</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">GC%</span>
                  <p className="text-sm font-bold text-teal-700">{activeAnalysis.gcContentPercent}%</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Mol. Weight</span>
                  <p className="text-sm font-bold text-purple-700">{activeAnalysis.molecularWeightKDa} kDa</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Est. Tm (°C)</span>
                  <p className="text-sm font-bold text-amber-700">{activeAnalysis.estimatedTmCelsius}°C</p>
                </div>
              </div>

              {/* Reverse Complement */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-700">5' $\rightarrow$ 3' Reverse Complement:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeAnalysis.reverseComplement);
                      setCopiedSeqNote(true);
                      setTimeout(() => setCopiedSeqNote(false), 2000);
                    }}
                    className="text-teal-700 hover:text-teal-900 font-semibold"
                  >
                    {copiedSeqNote ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-900 text-cyan-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-nowrap">
                  {activeAnalysis.reverseComplement || 'N/A'}
                </div>
              </div>

              {/* Restriction Enzyme Cut Sites */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 font-mono block">
                  Restriction Enzyme Sites ({activeAnalysis.restrictionSites.length} hits):
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeAnalysis.restrictionSites.length > 0 ? (
                    activeAnalysis.restrictionSites.map((rs, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-900"
                      >
                        {rs.enzyme} at pos {rs.cutIndex + 1} ({rs.recognitionSeq})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Zero standard restriction sites (EcoRI, BamHI, HindIII, BsaI, NotI, XhoI) found. Clean for Golden Gate assembly.
                    </span>
                  )}
                </div>
              </div>

              {/* Open Reading Frames */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 font-mono block">
                  Translated Peptide (Frame 1):
                </span>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 overflow-x-auto whitespace-nowrap">
                  {activeAnalysis.translationFrame1 || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VOLCANO PLOT & DEG INSPECTOR */}
      {subTab === 'volcano_qc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive SVG Volcano Plot */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 text-white rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-rose-400" />
                  <span>Interactive RNA-Seq Volcano Plot</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Log2 Fold Change vs -Log10(Adjusted P-Value)
                </p>
              </div>

              {/* Button to push plot directly to Wet Lab Paper */}
              <button
                type="button"
                onClick={() => handlePushVolcanoToPaper(papers[0]?.id || '')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Push Figure to Wet Lab Paper</span>
              </button>
            </div>

            {/* Interactive SVG Canvas */}
            <div className="relative bg-black rounded-xl p-4 border border-slate-800 flex items-center justify-center">
              <svg viewBox="0 0 500 320" className="w-full h-72">
                {/* Axes and grid */}
                <line x1="50" y1="280" x2="480" y2="280" stroke="#334155" strokeWidth="1.5" />
                <line x1="265" y1="280" x2="265" y2="20" stroke="#1e293b" strokeDasharray="4 4" />
                <line x1="50" y1="280" x2="50" y2="20" stroke="#334155" strokeWidth="1.5" />

                {/* Cutoff lines */}
                {/* -LogP cutoff horizontal line */}
                <line
                  x1="50"
                  y1={280 - volcanoPCutoff * 25}
                  x2="480"
                  y2={280 - volcanoPCutoff * 25}
                  stroke="#fb7185"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                {/* +FC cutoff line */}
                <line
                  x1={265 + volcanoFcCutoff * 40}
                  y1="280"
                  x2={265 + volcanoFcCutoff * 40}
                  y2="20"
                  stroke="#fb7185"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                {/* -FC cutoff line */}
                <line
                  x1={265 - volcanoFcCutoff * 40}
                  y1="280"
                  x2={265 - volcanoFcCutoff * 40}
                  y2="20"
                  stroke="#38bdf8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />

                {/* Axis Labels */}
                <text x="265" y="310" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  $\leftarrow$ Repressed | Log2 Fold Change | Induced $\rightarrow$
                </text>
                <text x="20" y="150" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace" transform="rotate(-90 20 150)">
                  -Log10 (Adjusted P-Value)
                </text>

                {/* Plotted Gene Scatter Points */}
                {SAMPLE_VOLCANO_GENES.map(g => {
                  const cx = 265 + g.log2fc * 40;
                  const cy = 280 - g.negLogP * 25;
                  const isHovered = hoveredGene?.gene === g.gene;
                  const color = g.status === 'up' ? '#f43f5e' : g.status === 'down' ? '#38bdf8' : '#64748b';

                  return (
                    <g key={g.gene} onMouseEnter={() => setHoveredGene(g)} onMouseLeave={() => setHoveredGene(null)}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 7 : 4.5}
                        fill={color}
                        stroke="#0f172a"
                        strokeWidth="1"
                        className="cursor-pointer transition-transform"
                      />
                      {(g.status !== 'ns' || isHovered) && (
                        <text
                          x={cx + 6}
                          y={cy + 3}
                          fill={isHovered ? '#ffffff' : color}
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                        >
                          {g.gene}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredGene && (
                <div className="absolute top-4 right-4 bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 max-w-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">{hoveredGene.gene}</span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                      hoveredGene.status === 'up' ? 'bg-rose-950 text-rose-300' : 'bg-cyan-950 text-cyan-300'
                    }`}>
                      {hoveredGene.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{hoveredGene.desc}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Log2 FC: {hoveredGene.log2fc}</span>
                    <span>-Log10 p: {hoveredGene.negLogP}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Significant DEG Table & Filters */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">
                Top Differentially Expressed Genes
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                FDR &lt; 0.05
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {SAMPLE_VOLCANO_GENES.filter(g => g.status !== 'ns').map(g => (
                <div
                  key={g.gene}
                  onMouseEnter={() => setHoveredGene(g)}
                  onMouseLeave={() => setHoveredGene(null)}
                  className={`p-3 rounded-xl border text-xs transition-colors flex items-center justify-between ${
                    hoveredGene?.gene === g.gene
                      ? 'bg-slate-900 text-white border-slate-800'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs">{g.gene}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        g.status === 'up' ? 'bg-rose-100 text-rose-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {g.status === 'up' ? '+UP' : '-DOWN'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{g.desc}</p>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <span className="font-bold block">
                      {g.log2fc > 0 ? `+${g.log2fc}` : g.log2fc}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      p={Math.pow(10, -g.negLogP).toExponential(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handlePushVolcanoToPaper(papers[0]?.id || '')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Attach Volcano Plot to Paper Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
