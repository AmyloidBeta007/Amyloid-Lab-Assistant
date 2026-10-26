import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDilution,
  calculateMasterMix,
  buildCitationNetwork,
  computeProtocolMetrics,
  computeMoodStats,
  formatTimeSeconds,
  searchPapers,
  analyzeSequence,
  filterDiscardedItems
} from './bioMath';
import { ResearchPaper, ProtocolStep, MoodLogEntry } from '../types';

test('calculateDilution: correctly calculates C1V1 = C2V2 dilution volumes', () => {
  // Stock 10M, Target 1M, Target volume 50mL
  const result = calculateDilution(10, 1, 50);
  assert.equal(result.isValid, true);
  assert.equal(result.v1Stock, 5);
  assert.equal(result.vDiluent, 45);

  // Invalid: C2 > C1
  const invalidResult = calculateDilution(1, 10, 50);
  assert.equal(invalidResult.isValid, false);
  assert.equal(invalidResult.v1Stock, 0);

  // Invalid zero concentration
  const zeroResult = calculateDilution(0, 1, 50);
  assert.equal(zeroResult.isValid, false);
});

test('calculateMasterMix: accurately scales reagents with 10% pipetting overage', () => {
  const reagents = [
    { name: '2X Taq Polymerase Master Mix', volumePerRxnUl: 12.5 },
    { name: 'Forward Primer (10 uM)', volumePerRxnUl: 1.0 },
    { name: 'Reverse Primer (10 uM)', volumePerRxnUl: 1.0 },
    { name: 'Nuclease-free Water', volumePerRxnUl: 8.5 }
  ];

  // 8 reactions with 10% dead volume factor = 8 * 1.1 = 8.8x
  const mix = calculateMasterMix(reagents, 8, 10);
  assert.equal(mix.length, 4);
  assert.equal(mix[0].perRxn, 12.5);
  assert.equal(mix[0].totalUl, 110); // 12.5 * 8.8 = 110
  assert.equal(mix[1].totalUl, 8.8); // 1.0 * 8.8 = 8.8
});

test('buildCitationNetwork: resolves directed citations and reverse citedBy mappings', () => {
  const mockPapers: ResearchPaper[] = [
    {
      id: 'paper-1',
      title: 'Original CRISPR Cas9 Discovery',
      authors: 'Jinek et al.',
      year: 2012,
      journal: 'Science',
      fieldTag: 'CRISPR & Gene Editing',
      targetQuestion: 'How does Streptococcus pyogenes Cas9 target DNA?',
      keyFindings: [],
      shortcomings: [],
      relevanceToMyResearch: 'Foundational mechanism',
      readingStatus: 'Synthesized',
      abstract: 'Dual-RNA–guided DNA cleavage...',
      notesMarkdown: '',
      highlights: [],
      referencesPaperIds: [],
      dateAdded: '2026-01-01'
    },
    {
      id: 'paper-2',
      title: 'Enhanced Specificity Cas9 (eSpCas9)',
      authors: 'Slaymaker et al.',
      year: 2016,
      journal: 'Science',
      fieldTag: 'CRISPR & Gene Editing',
      targetQuestion: 'How to reduce off-target cleavage?',
      keyFindings: [],
      shortcomings: [],
      relevanceToMyResearch: 'High-fidelity guide selection',
      readingStatus: 'Synthesized',
      abstract: 'Neutralizing non-specific DNA interactions...',
      notesMarkdown: '',
      highlights: [],
      referencesPaperIds: ['paper-1'],
      dateAdded: '2026-01-02'
    },
    {
      id: 'paper-3',
      title: 'Prime Editing for Precision Genome Edits',
      authors: 'Anzalone et al.',
      year: 2019,
      journal: 'Nature',
      fieldTag: 'CRISPR & Gene Editing',
      targetQuestion: 'Can we install edits without double-strand breaks?',
      keyFindings: [],
      shortcomings: [],
      relevanceToMyResearch: 'Target locus engineering',
      readingStatus: 'Reading',
      abstract: 'Search-and-replace editing...',
      notesMarkdown: '',
      highlights: [],
      referencesPaperIds: ['paper-1', 'paper-2'],
      dateAdded: '2026-01-03'
    }
  ];

  const network = buildCitationNetwork(mockPapers);
  assert.equal(network.nodes.length, 3);
  assert.equal(network.links.length, 3); // 2 -> 1, 3 -> 1, 3 -> 2

  // Paper 1 should be cited by paper 2 and paper 3 (inDegree = 2)
  const node1 = network.nodes.find(n => n.id === 'paper-1');
  assert.equal(node1?.inDegree, 2);
  assert.equal(node1?.outDegree, 0);

  // Paper 3 cites paper 1 and 2 (outDegree = 2)
  const node3 = network.nodes.find(n => n.id === 'paper-3');
  assert.equal(node3?.outDegree, 2);
  assert.equal(node3?.inDegree, 0);

  assert.deepEqual(network.citationMap['paper-1'].citedBy.sort(), ['paper-2', 'paper-3'].sort());
  assert.deepEqual(network.citationMap['paper-3'].cites.sort(), ['paper-1', 'paper-2'].sort());
});

test('computeProtocolMetrics: calculates completion percentage and remaining duration', () => {
  const steps: ProtocolStep[] = [
    { id: '1', order: 1, title: 'Cell Lysis', instruction: 'Add TRIzol', timerDurationSeconds: 300, completed: true },
    { id: '2', order: 2, title: 'Phase Separation', instruction: 'Centrifuge', timerDurationSeconds: 900, completed: true },
    { id: '3', order: 3, title: 'RNA Precipitation', instruction: 'Add isopropanol', timerDurationSeconds: 600, completed: false },
    { id: '4', order: 4, title: 'Ethanol Wash', instruction: 'Wash pellet', timerDurationSeconds: 300, completed: false }
  ];

  const metrics = computeProtocolMetrics(steps);
  assert.equal(metrics.totalSteps, 4);
  assert.equal(metrics.completedSteps, 2);
  assert.equal(metrics.percent, 50);
  assert.equal(metrics.remainingDurationMinutes, 15); // (600 + 300) / 60 = 15 min
});

test('computeMoodStats: calculates mood, energy and dominant lab trigger', () => {
  const entries: MoodLogEntry[] = [
    { id: '1', date: '2026-10-21', timestamp: 1, moodScore: 4, moodLabel: 'Productive', energyLevel: 5, reflection: 'Ran 2 gels', labTrigger: 'Clean Gel Band' },
    { id: '2', date: '2026-10-22', timestamp: 2, moodScore: 2, moodLabel: 'Frustrated', energyLevel: 3, reflection: 'Contamination', labTrigger: 'Contamination Crisis' },
    { id: '3', date: '2026-10-23', timestamp: 3, moodScore: 5, moodLabel: 'Eureka', energyLevel: 4, reflection: 'Band clean!', labTrigger: 'Clean Gel Band' }
  ];

  const stats = computeMoodStats(entries);
  assert.equal(stats.totalLogs, 3);
  assert.equal(stats.averageMood, 3.7); // (4 + 2 + 5) / 3 = 3.666 -> 3.7
  assert.equal(stats.averageEnergy, 4.0); // (5 + 3 + 4) / 3 = 4.0
  assert.equal(stats.dominantTrigger, 'Clean Gel Band');
});

test('formatTimeSeconds: formats seconds into MM:SS and HH:MM:SS accurately', () => {
  assert.equal(formatTimeSeconds(0), '00:00');
  assert.equal(formatTimeSeconds(59), '00:59');
  assert.equal(formatTimeSeconds(65), '01:05');
  assert.equal(formatTimeSeconds(3600), '01:00:00');
  assert.equal(formatTimeSeconds(3665), '01:01:05');
});

test('searchPapers: correctly filters by title, authors, and key findings across scopes', () => {
  const samplePapers: ResearchPaper[] = [
    {
      id: 'p1',
      title: 'A Programmable Dual-RNA Endonuclease',
      authors: 'Jinek M, Doudna JA, Charpentier E',
      year: 2012,
      journal: 'Science',
      fieldTag: 'CRISPR & Gene Editing',
      targetQuestion: 'Target cleavage',
      keyFindings: [
        { id: 'f1', text: 'Dual-RNA structure guides Cas9 endonuclease to cleave DNA', importance: 'critical', tags: [] }
      ],
      shortcomings: ['In vitro only'],
      relevanceToMyResearch: 'Foundational',
      readingStatus: 'Synthesized',
      abstract: 'Abstract',
      notesMarkdown: '',
      highlights: [],
      referencesPaperIds: [],
      dateAdded: '2026-10-01'
    },
    {
      id: 'p2',
      title: 'STAR: ultrafast universal RNA-seq aligner',
      authors: 'Dobin A, Gingeras TR',
      year: 2013,
      journal: 'Bioinformatics',
      fieldTag: 'Bioinformatics',
      targetQuestion: 'Spliced alignment',
      keyFindings: [
        { id: 'f2', text: 'Sequential Maximum Mappable Seed search on uncompressed suffix array', importance: 'critical', tags: [] }
      ],
      shortcomings: ['Requires 32GB RAM'],
      relevanceToMyResearch: 'Pipeline',
      readingStatus: 'Synthesized',
      abstract: 'Abstract',
      notesMarkdown: '',
      highlights: [],
      referencesPaperIds: [],
      dateAdded: '2026-10-02'
    }
  ];

  // 1. Search by title
  const titleResults = searchPapers(samplePapers, 'Programmable', 'title');
  assert.equal(titleResults.length, 1);
  assert.equal(titleResults[0].paper.id, 'p1');
  assert.equal(titleResults[0].matchedField, 'title');

  // 2. Search by author
  const authorResults = searchPapers(samplePapers, 'Doudna', 'authors');
  assert.equal(authorResults.length, 1);
  assert.equal(authorResults[0].paper.id, 'p1');
  assert.equal(authorResults[0].matchedField, 'authors');

  // 3. Search by key finding text
  const findingResults = searchPapers(samplePapers, 'suffix array', 'findings');
  assert.equal(findingResults.length, 1);
  assert.equal(findingResults[0].paper.id, 'p2');
  assert.equal(findingResults[0].matchedField, 'findings');

  // 4. Scope mismatch returns 0
  const mismatchResults = searchPapers(samplePapers, 'suffix array', 'title');
  assert.equal(mismatchResults.length, 0);

  // 5. 'all' scope matches any of the three
  const allResults = searchPapers(samplePapers, 'Gingeras', 'all');
  assert.equal(allResults.length, 1);
  assert.equal(allResults[0].paper.id, 'p2');
  assert.equal(allResults[0].matchedField, 'authors');
});

test('analyzeSequence: correctly analyzes DNA length, GC%, reverse complement, and EcoRI site', () => {
  // EcoRI recognition site: GAATTC
  const seq = 'ATGCGAATTCATCG';
  const result = analyzeSequence(seq);

  assert.equal(result.length, 14);
  // Counts: A: 4, T: 4, G: 3, C: 3. GC count = 6 / 14 = 42.9%
  assert.equal(result.gcContentPercent, 42.9);
  // Reverse complement of ATGCGAATTCATCG is CGATGAATTCGCAT
  assert.equal(result.reverseComplement, 'CGATGAATTCGCAT');
  // Restriction sites
  assert.equal(result.restrictionSites.length, 1);
  assert.equal(result.restrictionSites[0].enzyme, 'EcoRI');
  assert.equal(result.restrictionSites[0].cutIndex, 4);
});

test('filterDiscardedItems: partitions Wet Discard vs Dry Discard correctly', () => {
  const items: any[] = [
    {
      id: 'd1',
      originalId: 'orig-1',
      type: 'wet',
      category: 'figure',
      title: 'Bad Gel Band',
      previewText: 'High smear background',
      discardedAt: '2026-10-25'
    },
    {
      id: 'd2',
      originalId: 'orig-2',
      type: 'dry',
      category: 'target_outcome',
      title: 'Off-target Cas9 cleavage experiment #4',
      memoryReflection: 'Negative result: primer dimer caused false positive band at 150bp',
      tags: ['Negative Result', 'Troubleshooting'],
      discardedAt: '2026-10-24'
    }
  ];

  const wetItems = filterDiscardedItems(items, 'wet', 'all', '');
  assert.equal(wetItems.length, 1);
  assert.equal(wetItems[0].id, 'd1');

  const dryItems = filterDiscardedItems(items, 'dry', 'all', 'primer dimer');
  assert.equal(dryItems.length, 1);
  assert.equal(dryItems[0].id, 'd2');

  const dryCategoryMismatch = filterDiscardedItems(items, 'dry', 'figure', '');
  assert.equal(dryCategoryMismatch.length, 0);
});

