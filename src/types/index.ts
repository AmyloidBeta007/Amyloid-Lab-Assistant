export type HighlightColor = 'yellow' | 'emerald' | 'pink' | 'purple' | 'cyan';

export interface PaperHighlight {
  id: string;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

export interface KeyFinding {
  id: string;
  text: string;
  importance: 'critical' | 'supporting' | 'methodological';
  tags: string[];
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  pmid?: string;
  fieldTag: 'Molecular Genetics' | 'Bioinformatics' | 'CRISPR & Gene Editing' | 'RNA Biology' | 'Cell & Developmental' | 'Structural Biology' | 'Microbiology';
  targetQuestion: string; // What problem were they trying to solve?
  keyFindings: KeyFinding[];
  shortcomings: string[]; // Methodological weaknesses, limits, unaddressed questions
  relevanceToMyResearch: string; // Why this matters to the user's current project/thesis
  readingStatus: 'Must Read' | 'Reading' | 'Synthesized' | 'To Re-verify';
  abstract: string;
  notesMarkdown: string;
  highlights: PaperHighlight[];
  referencesPaperIds: string[]; // IDs of papers in the user's library cited by this paper
  citedByPaperIds?: string[]; // computed or manual reverse links
  paperUrl?: string;
  dateAdded: string;
  attachedImages?: PaperImageAttachment[];
}

export interface PaperImageAttachment {
  id: string;
  title: string;
  imageUrl: string; // Base64 dataURL or asset URL
  createdAt: string;
  notes?: string;
  annotationsCount?: number;
}

export interface TargetOutcomeRecord {
  id: string;
  targetObjective: string; // e.g. "Optimize Cas9 cleavage at target site BCL11A enhancer"
  hypothesis: string;
  linkedProtocolId?: string;
  linkedPaperIds: string[];
  status: 'In Progress' | 'Achieved' | 'Inconclusive' | 'Blocked by Pitfall';
  empiricalOutcome: string; // What actually happened in the assay/sequencing run
  shortcomingsAndPitfalls: string[]; // What failed or limited interpretation
  nextIterationAdjustment: string; // The tweak to apply in the next experiment
  dateLogged: string;
  sampleBatch?: string;
}

export interface ProtocolReagent {
  name: string;
  stockConc: string;
  finalConc: string;
  volumePerRxnUl: number;
}

export interface ProtocolStep {
  id: string;
  order: number;
  title: string;
  instruction: string;
  benchTip?: string;
  timerDurationSeconds?: number;
  timerLabel?: string;
  pipelineCommand?: string; // For bioinformatics pipelines (e.g. bash command)
  completed: boolean;
  notes?: string;
}

export interface Protocol {
  id: string;
  title: string;
  category: 'Wet Lab' | 'Bioinformatics' | 'Hybrid Protocol';
  estimatedDurationMin: number;
  difficulty: 'Standard' | 'Demanding' | 'Critical Precision';
  target: string;
  expectedOutcomes: string;
  knownShortcomingsAndTroubleshooting: string[];
  reagents: ProtocolReagent[];
  steps: ProtocolStep[];
  tags: string[];
  lastExecuted?: string;
  linkedPaperId?: string;
}

export interface LabTimer {
  id: string;
  name: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  type: 'incubation' | 'centrifuge' | 'hybridization' | 'pcr' | 'digestion' | 'custom';
  protocolStepTitle?: string;
  completedAt?: number;
}

export interface StopwatchLap {
  lapNumber: number;
  timeSeconds: number;
  splitSeconds: number;
  label?: string;
}

export interface LabSlotBooking {
  id: string;
  equipmentName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  bookedBy: string;
  projectGoal: string;
  sampleCount: number;
  reminderMinutesBefore: number;
  status: 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
}

export interface MoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  moodScore: number; // 1 to 5 (1: Devastated/Contamination, 5: Eureka/Breakthrough)
  moodLabel: string;
  energyLevel: number; // 1 to 5
  reflection: string;
  labTrigger: 'Clean Gel Band' | 'PCR Succeeded' | 'Contamination Crisis' | 'Sequencing Done' | 'Code/Pipeline Bug' | 'Hypothesis Validated' | 'Late Lab Night' | 'Paper Accepted';
}

export interface ActionItem {
  id: string;
  title: string;
  category: 'Bench Wet Lab' | 'Bioinformatics Pipeline' | 'Paper Reading' | 'Reagent Prep / Order' | 'Analysis & Discussion';
  priority: 'Immediate (Today)' | 'While Incubating' | 'Next Lab Slot' | 'Weekly Milestone';
  energyRequired: 'High Focus' | 'Medium Routine' | 'Low Energy Quick Win';
  completed: boolean;
  linkedPaperId?: string;
  linkedProtocolId?: string;
  dueDate?: string;
  createdAt: string;
}

// Discard feature types (Wet Discard vs Dry Discard)
export type DiscardType = 'wet' | 'dry'; // 'wet' = delete for now (quarantine/trash); 'dry' = keep as memory/negative result

export type DiscardItemCategory =
  | 'figure'
  | 'finding'
  | 'target_outcome'
  | 'bioinformatics_run'
  | 'protocol'
  | 'paper';

export interface DiscardedItem {
  id: string;
  originalId: string;
  type: DiscardType;
  category: DiscardItemCategory;
  title: string;
  previewText?: string;
  imageUrl?: string;
  dataPayload: any; // Full serialized object for restoration or inspection
  discardedAt: string;
  memoryReflection?: string; // For Dry Discard: why we retired this, scientific lesson, negative result details
  tags?: string[];
  parentTitle?: string;
  parentId?: string;
}

// Enhanced Bioinformatics types
export interface BioinformaticsPipelineRun {
  id: string;
  pipelineName: string;
  category: 'Transcriptomics' | 'Genomics' | 'Structural / AlphaFold' | 'Metagenomics' | 'Quality Control';
  sampleId: string;
  readType: 'Paired-End 150bp' | 'Single-End 75bp' | 'Long-Read Oxford Nanopore' | 'PacBio HiFi';
  inputFastq: string;
  referenceGenome: string;
  status: 'Completed' | 'Running' | 'Failed (Pipeline Error)' | 'Draft / Staged';
  dateRun: string;
  parameters: Record<string, string>;
  generatedCommands: string[];
  summaryOutput: {
    totalReads?: string;
    mappingRate?: string;
    detectedGenes?: number;
    significantHits?: number;
    q30Percent?: number;
    notes?: string;
  };
  plotImage?: string;
  linkedWetLabPaperId?: string;
  linkedWetLabProtocolId?: string;
  linkedTargetOutcomeId?: string;
}

export interface RestrictionSiteMatch {
  enzyme: string;
  recognitionSeq: string;
  cutIndex: number;
}

export interface OrfMatch {
  frame: number;
  start: number;
  end: number;
  lengthAa: number;
  peptide: string;
}

export interface SequenceAnalysisResult {
  rawSequence: string;
  cleanedSequence: string;
  length: number;
  gcContentPercent: number;
  atContentPercent: number;
  molecularWeightKDa: number;
  estimatedTmCelsius: number;
  reverseComplement: string;
  transcriptionRna: string;
  translationFrame1: string;
  translationFrame2: string;
  translationFrame3: string;
  restrictionSites: RestrictionSiteMatch[];
  openReadingFrames: OrfMatch[];
}

