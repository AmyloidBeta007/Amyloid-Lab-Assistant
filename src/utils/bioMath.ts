import {
  ProtocolStep, ResearchPaper, MoodLogEntry,
  DiscardedItem, DiscardType, SequenceAnalysisResult,
  RestrictionSiteMatch, OrfMatch
} from '../types';

/**
 * Calculates dilution stock volume needed:
 * C1 * V1 = C2 * V2  =>  V1 = (C2 * V2) / C1
 */
export function calculateDilution(c1: number, c2: number, v2: number): {
  v1Stock: number;
  vDiluent: number;
  isValid: boolean;
  errorMessage?: string;
} {
  if (c1 <= 0 || c2 <= 0 || v2 <= 0) {
    return { v1Stock: 0, vDiluent: 0, isValid: false, errorMessage: 'Concentrations and target volume must be positive.' };
  }
  if (c2 > c1) {
    return { v1Stock: 0, vDiluent: 0, isValid: false, errorMessage: 'Final concentration (C2) cannot exceed stock concentration (C1).' };
  }
  const v1Stock = (c2 * v2) / c1;
  const vDiluent = v2 - v1Stock;
  return {
    v1Stock: Math.round(v1Stock * 1000) / 1000,
    vDiluent: Math.round(vDiluent * 1000) / 1000,
    isValid: true
  };
}

/**
 * Calculates master mix volumes with standard laboratory overage (dead volume)
 * e.g. 10% extra for pipetting error/surface adhesion
 */
export function calculateMasterMix(
  reagents: Array<{ name: string; volumePerRxnUl: number }>,
  rxnCount: number,
  overagePercent: number = 10
): Array<{ name: string; perRxn: number; totalUl: number }> {
  const safeCount = Math.max(1, rxnCount);
  const factor = 1 + Math.max(0, overagePercent) / 100;
  return reagents.map(r => ({
    name: r.name,
    perRxn: r.volumePerRxnUl,
    totalUl: Math.round(r.volumePerRxnUl * safeCount * factor * 100) / 100
  }));
}

/**
 * Resolves bidirectional citation graph for papers in the user's library
 */
export interface CitationGraphNode {
  id: string;
  title: string;
  authors: string;
  year: number;
  fieldTag: string;
  inDegree: number; // cited by N papers in library
  outDegree: number; // cites N papers in library
}

export interface CitationGraphLink {
  source: string;
  target: string;
}

export function buildCitationNetwork(papers: ResearchPaper[]): {
  nodes: CitationGraphNode[];
  links: CitationGraphLink[];
  citationMap: Record<string, { cites: string[]; citedBy: string[] }>;
} {
  const paperIdSet = new Set(papers.map(p => p.id));
  const links: CitationGraphLink[] = [];
  const citationMap: Record<string, { cites: string[]; citedBy: string[] }> = {};

  for (const paper of papers) {
    citationMap[paper.id] = { cites: [], citedBy: [] };
  }

  for (const paper of papers) {
    const validRefs = paper.referencesPaperIds.filter(refId => paperIdSet.has(refId) && refId !== paper.id);
    for (const refId of validRefs) {
      links.push({ source: paper.id, target: refId });
      citationMap[paper.id].cites.push(refId);
      citationMap[refId].citedBy.push(paper.id);
    }
  }

  const nodes: CitationGraphNode[] = papers.map(paper => ({
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    year: paper.year,
    fieldTag: paper.fieldTag,
    inDegree: citationMap[paper.id]?.citedBy.length || 0,
    outDegree: citationMap[paper.id]?.cites.length || 0
  }));

  return { nodes, links, citationMap };
}

/**
 * Computes protocol completion metrics
 */
export function computeProtocolMetrics(steps: ProtocolStep[]): {
  totalSteps: number;
  completedSteps: number;
  percent: number;
  remainingDurationMinutes: number;
} {
  const totalSteps = steps.length;
  if (totalSteps === 0) {
    return { totalSteps: 0, completedSteps: 0, percent: 0, remainingDurationMinutes: 0 };
  }
  const completedSteps = steps.filter(s => s.completed).length;
  const percent = Math.round((completedSteps / totalSteps) * 100);

  const remainingSeconds = steps
    .filter(s => !s.completed)
    .reduce((acc, s) => acc + (s.timerDurationSeconds || 0), 0);

  return {
    totalSteps,
    completedSteps,
    percent,
    remainingDurationMinutes: Math.ceil(remainingSeconds / 60)
  };
}

/**
 * Computes mood and energy statistics
 */
export function computeMoodStats(entries: MoodLogEntry[]): {
  averageMood: number;
  averageEnergy: number;
  totalLogs: number;
  streakDays: number;
  dominantTrigger: string;
} {
  if (entries.length === 0) {
    return { averageMood: 0, averageEnergy: 0, totalLogs: 0, streakDays: 0, dominantTrigger: 'None' };
  }

  const sumMood = entries.reduce((acc, e) => acc + e.moodScore, 0);
  const sumEnergy = entries.reduce((acc, e) => acc + e.energyLevel, 0);

  const triggerCounts: Record<string, number> = {};
  for (const e of entries) {
    triggerCounts[e.labTrigger] = (triggerCounts[e.labTrigger] || 0) + 1;
  }

  let topTrigger = 'None';
  let topCount = 0;
  for (const [trigger, count] of Object.entries(triggerCounts)) {
    if (count > topCount) {
      topCount = count;
      topTrigger = trigger;
    }
  }

  return {
    averageMood: Math.round((sumMood / entries.length) * 10) / 10,
    averageEnergy: Math.round((sumEnergy / entries.length) * 10) / 10,
    totalLogs: entries.length,
    streakDays: Math.min(entries.length, 7),
    dominantTrigger: topTrigger
  };
}

/**
 * Formats seconds into HH:MM:SS or MM:SS
 */
export function formatTimeSeconds(totalSec: number): string {
  const safeSec = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export type SearchScope = 'all' | 'title' | 'authors' | 'findings';

export interface PaperSearchResult {
  paper: ResearchPaper;
  matchedField: 'title' | 'authors' | 'findings' | 'none';
  snippet?: string;
}

/**
 * Searches research papers by title, authors, or key findings
 */
export function searchPapers(
  papers: ResearchPaper[],
  query: string,
  scope: SearchScope = 'all'
): PaperSearchResult[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return papers.map(paper => ({ paper, matchedField: 'none' }));
  }

  const results: PaperSearchResult[] = [];

  for (const paper of papers) {
    const titleMatch = paper.title.toLowerCase().includes(cleanQuery);
    const authorsMatch = paper.authors.toLowerCase().includes(cleanQuery);
    const matchedFinding = paper.keyFindings.find(f => f.text.toLowerCase().includes(cleanQuery));

    if (scope === 'title') {
      if (titleMatch) {
        results.push({ paper, matchedField: 'title', snippet: paper.title });
      }
    } else if (scope === 'authors') {
      if (authorsMatch) {
        results.push({ paper, matchedField: 'authors', snippet: paper.authors });
      }
    } else if (scope === 'findings') {
      if (matchedFinding) {
        results.push({ paper, matchedField: 'findings', snippet: matchedFinding.text });
      }
    } else {
      // 'all' scope: check title, then findings, then authors
      if (titleMatch) {
        results.push({ paper, matchedField: 'title', snippet: paper.title });
      } else if (matchedFinding) {
        results.push({ paper, matchedField: 'findings', snippet: matchedFinding.text });
      } else if (authorsMatch) {
        results.push({ paper, matchedField: 'authors', snippet: paper.authors });
      }
    }
  }

  return results;
}

// Genetic Codon Table (Standard)
const CODON_TABLE: Record<string, string> = {
  'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
  'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
  'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
  'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
  'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
  'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
  'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
  'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};

// Restriction Enzymes Reference
const RESTRICTION_ENZYMES = [
  { enzyme: 'EcoRI', recognitionSeq: 'GAATTC' },
  { enzyme: 'BamHI', recognitionSeq: 'GGATCC' },
  { enzyme: 'HindIII', recognitionSeq: 'AAGCTT' },
  { enzyme: 'BsaI', recognitionSeq: 'GGTCTC' },
  { enzyme: 'NotI', recognitionSeq: 'GCGGCCGC' },
  { enzyme: 'XhoI', recognitionSeq: 'CTCGAG' },
  { enzyme: 'PstI', recognitionSeq: 'CTGCAG' }
];

/**
 * Translates a DNA sequence into an amino acid sequence given a reading frame (0, 1, or 2)
 */
export function translateDnaFrame(dna: string, frame: number = 0): string {
  const clean = dna.toUpperCase().replace(/[^ATGC]/g, '');
  let protein = '';
  for (let i = frame; i + 2 < clean.length; i += 3) {
    const codon = clean.substring(i, i + 3);
    protein += CODON_TABLE[codon] || '?';
  }
  return protein;
}

/**
 * Generates reverse complement for a DNA string
 */
export function getReverseComplement(dna: string): string {
  const complementMap: Record<string, string> = {
    A: 'T', T: 'A', G: 'C', C: 'G',
    U: 'A', N: 'N',
    a: 't', t: 'a', g: 'c', c: 'g', u: 'a', n: 'n'
  };
  return dna
    .split('')
    .reverse()
    .map(c => complementMap[c] || c)
    .join('');
}

/**
 * In-silico sequence analyzer for the Bioinformatics Studio
 */
export function analyzeSequence(rawSequence: string): SequenceAnalysisResult {
  const cleaned = rawSequence.toUpperCase().replace(/[^ATGCN]/g, '');
  const length = cleaned.length;

  if (length === 0) {
    return {
      rawSequence,
      cleanedSequence: '',
      length: 0,
      gcContentPercent: 0,
      atContentPercent: 0,
      molecularWeightKDa: 0,
      estimatedTmCelsius: 0,
      reverseComplement: '',
      transcriptionRna: '',
      translationFrame1: '',
      translationFrame2: '',
      translationFrame3: '',
      restrictionSites: [],
      openReadingFrames: []
    };
  }

  let countA = 0;
  let countT = 0;
  let countG = 0;
  let countC = 0;

  for (let i = 0; i < length; i++) {
    const char = cleaned[i];
    if (char === 'A') countA++;
    else if (char === 'T') countT++;
    else if (char === 'G') countG++;
    else if (char === 'C') countC++;
  }

  const gcCount = countG + countC;
  const atCount = countA + countT;
  const gcPercent = length > 0 ? Math.round((gcCount / length) * 1000) / 10 : 0;
  const atPercent = length > 0 ? Math.round((atCount / length) * 1000) / 10 : 0;

  // Molecular Weight estimate for ssDNA: MW = (A * 313.21) + (T * 304.2) + (C * 289.18) + (G * 329.21) - 61.96
  const mwDaltons = Math.max(0, (countA * 313.21) + (countT * 304.2) + (countC * 289.18) + (countG * 329.21) - 61.96);
  const mwKDa = Math.round((mwDaltons / 1000) * 100) / 100;

  // Estimated Tm: Basic Wallace rule for oligo < 14 bp: 2(A+T) + 4(G+C)
  // For >= 14 bp: 64.9 + 41 * (G+C - 16.4) / length
  let estimatedTm = 0;
  if (length > 0 && length < 14) {
    estimatedTm = Math.round((2 * atCount + 4 * gcCount) * 10) / 10;
  } else if (length >= 14) {
    estimatedTm = Math.round((64.9 + (41 * (gcCount - 16.4)) / length) * 10) / 10;
  }

  const reverseComplement = getReverseComplement(cleaned);
  const transcriptionRna = cleaned.replace(/T/g, 'U');

  const translationFrame1 = translateDnaFrame(cleaned, 0);
  const translationFrame2 = translateDnaFrame(cleaned, 1);
  const translationFrame3 = translateDnaFrame(cleaned, 2);

  // Restriction sites
  const restrictionSites: RestrictionSiteMatch[] = [];
  for (const re of RESTRICTION_ENZYMES) {
    let pos = 0;
    while ((pos = cleaned.indexOf(re.recognitionSeq, pos)) !== -1) {
      restrictionSites.push({
        enzyme: re.enzyme,
        recognitionSeq: re.recognitionSeq,
        cutIndex: pos
      });
      pos += 1;
    }
  }

  // Find ORFs (ATG to stop codon in frame 0, 1, 2 with length >= 10 aa)
  const openReadingFrames: OrfMatch[] = [];
  for (let f = 0; f < 3; f++) {
    for (let i = f; i + 2 < cleaned.length; i += 3) {
      const codon = cleaned.substring(i, i + 3);
      if (codon === 'ATG') {
        // Start found, scan for stop codon
        for (let j = i + 3; j + 2 < cleaned.length; j += 3) {
          const stopCandidate = cleaned.substring(j, j + 3);
          if (stopCandidate === 'TAA' || stopCandidate === 'TAG' || stopCandidate === 'TGA') {
            const orfNt = cleaned.substring(i, j + 3);
            const peptide = translateDnaFrame(orfNt, 0).replace(/\*$/, '');
            if (peptide.length >= 10) {
              openReadingFrames.push({
                frame: f + 1,
                start: i + 1,
                end: j + 3,
                lengthAa: peptide.length,
                peptide
              });
            }
            break;
          }
        }
      }
    }
  }

  return {
    rawSequence,
    cleanedSequence: cleaned,
    length,
    gcContentPercent: gcPercent,
    atContentPercent: atPercent,
    molecularWeightKDa: mwKDa,
    estimatedTmCelsius: estimatedTm,
    reverseComplement,
    transcriptionRna,
    translationFrame1,
    translationFrame2,
    translationFrame3,
    restrictionSites,
    openReadingFrames
  };
}

/**
 * Filter Discarded Items (Wet Discard quarantine or Dry Discard memory vault)
 */
export function filterDiscardedItems(
  items: DiscardedItem[],
  type: DiscardType,
  categoryFilter: string = 'all',
  searchQuery: string = ''
): DiscardedItem[] {
  const cleanQ = searchQuery.trim().toLowerCase();
  return items.filter(item => {
    if (item.type !== type) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (!cleanQ) return true;

    return (
      item.title.toLowerCase().includes(cleanQ) ||
      (item.previewText && item.previewText.toLowerCase().includes(cleanQ)) ||
      (item.memoryReflection && item.memoryReflection.toLowerCase().includes(cleanQ)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(cleanQ))) ||
      (item.parentTitle && item.parentTitle.toLowerCase().includes(cleanQ))
    );
  });
}


