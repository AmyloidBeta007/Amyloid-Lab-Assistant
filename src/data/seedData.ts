import {
  ResearchPaper, Protocol, TargetOutcomeRecord, LabSlotBooking,
  MoodLogEntry, ActionItem, DiscardedItem, BioinformaticsPipelineRun
} from '../types';

export const SEED_PAPERS: ResearchPaper[] = [
  {
    id: 'paper-jinek-2012',
    title: 'A Programmable Dual-RNA–Guided DNA Endonuclease in Adaptive Bacterial Immunity',
    authors: 'Jinek M, Chylinski K, Fonfara I, Hauer M, Doudna JA, Charpentier E',
    year: 2012,
    journal: 'Science',
    doi: '10.1126/science.1225829',
    pmid: '22745249',
    fieldTag: 'CRISPR & Gene Editing',
    targetQuestion: 'How does the Streptococcus pyogenes Cas9 endonuclease identify and cleave target DNA substrates, and can the dual crRNA:tracrRNA be engineered into a single chimeric guide RNA?',
    keyFindings: [
      {
        id: 'kf-1',
        text: 'Cas9 requires both a 20-nt guide crRNA and a trans-activating crRNA (tracrRNA) forming a duplex to trigger site-specific double-strand DNA cleavage.',
        importance: 'critical',
        tags: ['Mechanism', 'crRNA:tracrRNA']
      },
      {
        id: 'kf-2',
        text: 'Demonstrated that fusing crRNA and tracrRNA with a GAAA loop generates a functional single-guide RNA (sgRNA) that reprograms Cas9 cleavage in vitro.',
        importance: 'critical',
        tags: ['Engineering', 'sgRNA']
      },
      {
        id: 'kf-3',
        text: 'Identified that target cleavage requires an adjacent 5\'-NGG-3\' protospacer adjacent motif (PAM) located directly downstream of the target protospacer.',
        importance: 'methodological',
        tags: ['PAM', 'Specificity']
      }
    ],
    shortcomings: [
      'In vitro biochemical experiments only; did not demonstrate eukaryotic chromatin penetration or genome editing in mammalian living cells in this paper.',
      'Did not assess genome-wide off-target cleavage promiscuity or non-canonical PAM tolerance (e.g. NAG PAM).',
      'Delivery vehicle constraints and nuclear localization signal (NLS) kinetics were not addressed.'
    ],
    relevanceToMyResearch: 'Foundational benchmark for our lab\'s Cas9 ribonucleoprotein (RNP) nucleofection assays. We reference their cleavage site 3 bp upstream of PAM when analyzing deep sequencing indel windows.',
    readingStatus: 'Synthesized',
    abstract: 'Clustered regularly interspaced short palindromic repeats (CRISPR)/CRISPR-associated (Cas) systems provide bacteria and archaea with adaptive immunity against viruses and plasmids by using RNA-guided nucleases to cleave foreign nucleic acids. We show that Cas9 is guided by a dual-RNA structure formed by activating tracrRNA and targeting crRNA to cleave site-specifically. We engineered a single-guide RNA chimera capable of facilitating targeted DNA cleavage.',
    notesMarkdown: `### Core Lab Takeaways for Our Gene Knockout Pipeline
1. **Target Design**: Cleavage strictly occurs **3 nucleotides upstream** of the 5'-NGG PAM on both strands (blunt end cut).
2. **sgRNA Chimera Structure**: The 82-nt chimeric RNA has a 20-nt guide sequence + 4-nt loop + 60-nt stem-loop hairpin.
3. **Buffer conditions**: Active in standard NEB CutSmart / Cas9 buffer with Mg2+ co-factor at 37°C.`,
    highlights: [
      {
        id: 'hl-1',
        text: 'A chimeric dual-RNA containing a 20-nt guide sequence at the 5\' end and a hairpin loop was sufficient to program Cas9 for site-specific cleavage.',
        color: 'yellow',
        note: 'Key design rule for synthetic sgRNA oligonucleotides',
        createdAt: '2026-10-20'
      },
      {
        id: 'hl-2',
        text: 'Cleavage occurs precisely 3 base pairs upstream of the PAM on both strands, creating predominantly blunt ends.',
        color: 'emerald',
        note: 'Crucial for measuring NHEJ microhomology repair distance',
        createdAt: '2026-10-21'
      }
    ],
    referencesPaperIds: [],
    dateAdded: '2026-10-15',
    attachedImages: [
      {
        id: 'img-seed-1',
        title: 'Cas9 In Vitro Cleavage Assay Agarose Gel',
        imageUrl: '/src/assets/images/bio_lab_bench_hero_1792938142791.jpg',
        createdAt: '2026-10-21',
        notes: 'Target band cleavage observed with dual-RNA and single-guide chimera A',
        annotationsCount: 2
      }
    ]
  },
  {
    id: 'paper-slaymaker-2016',
    title: 'Rationally engineered Cas9 nucleases with improved specificity',
    authors: 'Slaymaker IM, Gao L, Zetsche B, Scott DA, Yan WX, Zhang F',
    year: 2016,
    journal: 'Science',
    doi: '10.1126/science.aad5227',
    pmid: '26628643',
    fieldTag: 'CRISPR & Gene Editing',
    targetQuestion: 'Can structure-guided neutralization of positively charged residues in the SpCas9 non-target DNA strand groove decrease off-target cleavage without destroying on-target efficiency?',
    keyFindings: [
      {
        id: 'kf-4',
        text: 'Engineered "eSpCas9(1.1)" with three alanine substitutions (K848A, K1003A, R1060A) weakens non-target strand binding and drastically reduces off-target cleavage across the human genome.',
        importance: 'critical',
        tags: ['eSpCas9', 'Off-target Reduction']
      },
      {
        id: 'kf-5',
        text: 'On-target cleavage efficiency remained comparable to wild-type SpCas9 for ~80% of verified genomic loci.',
        importance: 'supporting',
        tags: ['Efficiency', 'Validation']
      }
    ],
    shortcomings: [
      'Certain GC-rich or truncated guide RNAs exhibited marked drops in on-target editing efficiency (up to 40% loss).',
      'Did not explore prime editing or base editing fusion architectures.',
      'Evaluated predominantly in HEK293T cells; in vivo immunogenicity not studied.'
    ],
    relevanceToMyResearch: 'Directly informs our guide RNA selection strategy: if our guide has high predicted off-targets, we swap from wild-type Cas9 to eSpCas9 or HiFi Cas9.',
    readingStatus: 'Synthesized',
    abstract: 'Targeted genome editing using Cas9 from Streptococcus pyogenes is constrained by off-target genomic cleavage. Using structure-guided protein engineering, we altered Cas9 to weaken non-target strand binding. These engineered "enhanced specificity" Cas9 variants (eSpCas9) reduce off-target cleavage to undetectable levels while preserving robust on-target cleavage.',
    notesMarkdown: `### Comparison vs Wild-Type SpCas9:
- **Variant tested**: eSpCas9(1.1) harboring K848A/K1003A/R1060A.
- **Mechanism**: Weakens the electrostatic interaction with the non-target DNA strand, raising the energetic threshold for DNA unwinding and strand displacement so only fully complementary targets activate the HNH and RuvC domains.`,
    highlights: [
      {
        id: 'hl-3',
        text: 'By weakening non-target strand stabilization, eSpCas9 raises stringency for target matching without lowering catalytic velocity at perfectly matched sites.',
        color: 'pink',
        note: 'Important thermodynamic explanation for thesis literature review',
        createdAt: '2026-10-22'
      }
    ],
    referencesPaperIds: ['paper-jinek-2012'],
    dateAdded: '2026-10-18'
  },
  {
    id: 'paper-anzalone-2019',
    title: 'Search-and-replace local prime editing without double-strand breaks or donor templates',
    authors: 'Anzalone AV, Randolph PB, Davis JR, Sousa AA, Koblan LW, Levy JM, Chen PJ, Wilson C, Newby GA, Liu DR',
    year: 2019,
    journal: 'Nature',
    doi: '10.1038/s41586-019-1711-4',
    pmid: '31634902',
    fieldTag: 'CRISPR & Gene Editing',
    targetQuestion: 'How can all 12 types of point mutations, insertions, and deletions be installed in human genomic DNA without inducing double-strand DNA breaks (DSBs) or relying on exogenous homologous donor templates?',
    keyFindings: [
      {
        id: 'kf-6',
        text: 'Developed Prime Editors (PE1, PE2, PE3) fusing Cas9 H840A nickase with an engineered M-MLV reverse transcriptase, programmed by a prime editing guide RNA (pegRNA).',
        importance: 'critical',
        tags: ['Prime Editing', 'pegRNA', 'M-MLV RT']
      },
      {
        id: 'kf-7',
        text: 'pegRNA specifies target genomic locus and encodes the desired edit in an extended 3\' extension, directly writing information into the nicked target strand.',
        importance: 'critical',
        tags: ['Search and Replace', 'Precision']
      },
      {
        id: 'kf-8',
        text: 'Generates dramatically fewer bystander indel byproducts (<1-5%) compared to standard Cas9 DSB repair pathways.',
        importance: 'supporting',
        tags: ['Low Indel', 'Safety']
      }
    ],
    shortcomings: [
      'Prime editor constructs are very large (~6.3 kb cDNA), posing major packaging challenges for single adeno-associated virus (AAV) delivery.',
      'pegRNA design rules are complex (PBS length and RT template length require extensive empirical optimization per target).',
      'Editing efficiency in primary cells and stem cells can be variable (often <10-15% without PEmax enhancements).'
    ],
    relevanceToMyResearch: 'Central to our lab\'s precision disease variant correction project. We are designing pegRNAs for the pathogenic variant in exon 4 and comparing PE3 efficiency against HDR templates.',
    readingStatus: 'Reading',
    abstract: 'Most genetic diseases arise from point mutations, insertions, or deletions. Here we describe prime editing, a search-and-replace genome editing technology that writes new genetic information directly into a specified DNA site using a catalytically impaired Cas9 endonuclease fused to an engineered reverse transcriptase, guided by a prime editing guide RNA (pegRNA).',
    notesMarkdown: `### pegRNA Design Guidelines:
- **Primer Binding Site (PBS)**: Typically 13 nt length (aim for Tm around 30°C).
- **Reverse Transcription (RT) Template**: 10 to 16 nt containing the desired edit + 10-15 nt homology.
- **PE3 Strategy**: Nick the non-edited strand with a secondary sgRNA ~50-90 bp away to bias mismatch repair toward the newly edited strand.`,
    highlights: [
      {
        id: 'hl-4',
        text: 'Prime editing does not require double-strand breaks or donor DNA, yet can install any transitions, transversions, insertions (up to 44 bp), or deletions (up to 80 bp).',
        color: 'cyan',
        note: 'Quote for thesis introduction chapter',
        createdAt: '2026-10-23'
      }
    ],
    referencesPaperIds: ['paper-jinek-2012', 'paper-slaymaker-2016'],
    dateAdded: '2026-10-20'
  },
  {
    id: 'paper-dobin-2013',
    title: 'STAR: ultrafast universal RNA-seq aligner',
    authors: 'Dobin A, Davis CA, Schlesinger F, Drenkow J, Zaleski C, Jha S, Batut P, Chaisson M, Gingeras TR',
    year: 2013,
    journal: 'Bioinformatics',
    doi: '10.1093/bioinformatics/bts635',
    pmid: '23104886',
    fieldTag: 'Bioinformatics',
    targetQuestion: 'How can high-throughput RNA-seq reads containing spliced non-contiguous junctions across introns be mapped to mammalian genomes at maximum speed without sacrificing accuracy?',
    keyFindings: [
      {
        id: 'kf-9',
        text: 'Introduced Sequential Maximum Mappable Seed search on an uncompressed suffix array, achieving speeds >50x faster than TopHat2.',
        importance: 'critical',
        tags: ['Alignment', 'Suffix Array', 'Splicing']
      },
      {
        id: 'kf-10',
        text: 'Accurately aligns non-canonical splice junctions, chimeric transcripts (fusion genes), and circular RNAs in a single pass.',
        importance: 'supporting',
        tags: ['Fusion Genes', 'Junctions']
      }
    ],
    shortcomings: [
      'High random access memory (RAM) requirement: demands ~32 GB of RAM for indexing and aligning to the human hg38 genome.',
      'Default parameters can over-call spurious junctions in ultra-deep libraries unless two-pass mode (--twopassMode Basic) is explicitly invoked.'
    ],
    relevanceToMyResearch: 'Core alignment engine for our differential expression pipeline. We run STAR with 2-pass mode on our cluster node before feeding BAM files to featureCounts and DESeq2.',
    readingStatus: 'Synthesized',
    abstract: 'Accurate alignment of high-throughput RNA sequencing reads is critical. We present Spliced Transcripts Alignment to a Reference (STAR), based on a previously undescribed RNA-seq alignment algorithm that uses sequential maximum mappable seed search in uncompressed suffix arrays followed by seed clustering and stitching.',
    notesMarkdown: `### Cluster Execution Flags:
\`\`\`bash
STAR --runThreadN 16 \\
     --genomeDir /ref/hg38_star_index \\
     --readFilesIn sample_R1.fastq.gz sample_R2.fastq.gz \\
     --readFilesCommand zcat \\
     --outSAMtype BAM SortedByCoordinate \\
     --twopassMode Basic \\
     --quantMode GeneCounts
\`\`\``,
    highlights: [
      {
        id: 'hl-5',
        text: 'STAR aligns 550 million 2x76 bp paired-end reads per hour on a 12-core server while achieving the highest sensitivity and precision for spliced alignments.',
        color: 'purple',
        note: 'Benchmark justification for lab compute cluster grant report',
        createdAt: '2026-10-21'
      }
    ],
    referencesPaperIds: [],
    dateAdded: '2026-10-17'
  },
  {
    id: 'paper-love-2014',
    title: 'Moderated estimation of fold change and dispersion for RNA-seq data with DESeq2',
    authors: 'Love MI, Huber W, Anders S',
    year: 2014,
    journal: 'Genome Biology',
    doi: '10.1186/s13059-014-0550-8',
    pmid: '25516281',
    fieldTag: 'Bioinformatics',
    targetQuestion: 'How can small sample sizes in RNA-seq experiments be modeled robustly against biological noise and heteroscedastic dispersion without generating false positive differentially expressed genes (DEGs)?',
    keyFindings: [
      {
        id: 'kf-11',
        text: 'DESeq2 uses empirical Bayes shrinkage estimators for dispersion and fold changes, stabilizing variance for low-count genes.',
        importance: 'critical',
        tags: ['Empirical Bayes', 'Shrinkage', 'Dispersion']
      },
      {
        id: 'kf-12',
        text: 'Incorporates Cook\'s distance outlier detection to prevent single aberrant replicate outliers from driving false discoveries.',
        importance: 'methodological',
        tags: ['Outlier Filtering', 'Cook\'s Distance']
      }
    ],
    shortcomings: [
      'Assumes negative binomial distribution; may exhibit false positive inflation in single-cell RNA-seq (scRNA-seq) with extreme dropout zeros (where zero-inflated models like MAST or pseudobulk are preferred).',
      'Assumes majority of genes are NOT differentially expressed for median-of-ratios library size normalization.'
    ],
    relevanceToMyResearch: 'Used for all RNA-seq differential expression calculations in our knockout vs wild-type transcriptome comparisons. Must remember to apply lfcShrink(type="apeglm") before plotting volcano plots!',
    readingStatus: 'Synthesized',
    abstract: 'In RNA-seq data analysis, hypothesis testing for differential expression is hampered by biological variability and small numbers of replicates. DESeq2 integrates empirical Bayes shrinkage estimation for dispersion and log fold changes, improving stability and interpretability of estimates while controlling false positive rates.',
    notesMarkdown: `### Key Rule in Our R Analysis Script:
1. Always run \`lfcShrink(dds, coef="condition_treated_vs_control", type="apeglm")\` to shrink high-variance low-count fold changes.
2. Filter adjusted p-value (padj < 0.05) and |log2FoldChange| > 1.0.`,
    highlights: [
      {
        id: 'hl-6',
        text: 'Shrinkage of effect sizes prevents low-count genes with high Poisson sampling variance from dominating top ranked differentially expressed lists.',
        color: 'yellow',
        note: 'Always emphasize this during lab meeting presentations',
        createdAt: '2026-10-22'
      }
    ],
    referencesPaperIds: ['paper-dobin-2013'],
    dateAdded: '2026-10-19'
  },
  {
    id: 'paper-zheng-2017',
    title: 'Massively parallel digital transcriptional profiling of single cells',
    authors: 'Zheng GX, Terry JM, Belgrader P, Ryvkin P, Bent ZW, Wilson R, Ziraldo SB, et al.',
    year: 2017,
    journal: 'Nature Communications',
    doi: '10.1038/ncomms14049',
    pmid: '28091601',
    fieldTag: 'RNA Biology',
    targetQuestion: 'How can tens of thousands of individual cells be barcoded in droplets simultaneously with high capture efficiency to dissect cellular heterogeneity?',
    keyFindings: [
      {
        id: 'kf-13',
        text: 'Developed microfluidic Gel Bead-in-Emulsion (GEM) droplet encapsulation tagging single-cell cDNA with unique 10x cell barcodes and UMIs.',
        importance: 'critical',
        tags: ['10x Genomics', 'Droplet microfluidics', 'UMI']
      },
      {
        id: 'kf-14',
        text: 'Demonstrated profiling of 68,000 peripheral blood mononuclear cells (PBMCs) dissecting subtle immune sub-populations with high digital fidelity.',
        importance: 'supporting',
        tags: ['Immune profiling', 'PBMC', 'Heterogeneity']
      }
    ],
    shortcomings: [
      'High 3\' transcript end bias (does not provide full-length transcript isoform resolution or alternative splicing detection).',
      'High ambient RNA contamination and doublets when cell viability drops below 85% during dissociation.'
    ],
    relevanceToMyResearch: 'Informs our single-cell dissociation protocol: cell viability must exceed 90% via Trypan Blue before loading the microfluidic chip, or GEM oil droplets will capture spilled ambient lysis RNA.',
    readingStatus: 'Must Read',
    abstract: 'Single-cell RNA sequencing reveals gene expression diversity that is obscured in bulk analyses. We describe a droplet-based platform that microfluidically encapsulates single cells with hydrogel delivery beads, enabling digital counting of transcripts from tens of thousands of individual cells in parallel.',
    notesMarkdown: `### Cell Prep Quality Standards:
- Minimum viability: **>85%** (ideal >90%).
- Target cell concentration: **700 - 1,200 cells/uL**.
- Inspect for cell clumping; pass through a 40 um cell strainer if aggregates observed.`,
    highlights: [
      {
        id: 'hl-7',
        text: 'Single-cell suspensions must be processed immediately on ice with high viability to prevent ambient mRNA contamination in the partition oil.',
        color: 'emerald',
        note: 'Crucial checklist item before booking the Chromium controller',
        createdAt: '2026-10-24'
      }
    ],
    referencesPaperIds: ['paper-dobin-2013', 'paper-love-2014'],
    dateAdded: '2026-10-22'
  }
];

export const SEED_PROTOCOLS: Protocol[] = [
  {
    id: 'proto-rna-trizol',
    title: 'High-Integrity Total RNA Extraction & Quality Check (TRIzol + Column)',
    category: 'Wet Lab',
    estimatedDurationMin: 75,
    difficulty: 'Critical Precision',
    target: 'Extract high-integrity total RNA from cultured mammalian cells with RNA Integrity Number (RIN) >= 8.5, A260/280 ratio between 1.95 - 2.10, and yield > 10 ug for RNA sequencing.',
    expectedOutcomes: 'Clear visual aqueous/organic phase boundary; firm white RNA pellet after isopropanol precipitation; sharp 28S and 18S ribosomal RNA electropherogram peaks with 28S:18S ratio >= 2.0; undetectable genomic DNA contamination.',
    knownShortcomingsAndTroubleshooting: [
      'Phenol carryover (indicated by 260/230 ratio < 1.6): Avoid touching the interphase layer when collecting aqueous phase (leave 100 uL behind).',
      'Over-dried RNA pellet: Becomes insoluble in nuclease-free water; air dry for 5-8 min only until pellet turns translucent, do not vacuum dry.',
      'RNase degradation: Wipe pipettes and bench with RNase Away, use certified filter barrier tips, and keep all steps at 4°C/ice unless specified.',
      'Genomic DNA contamination: Perform on-column DNase I digestion for 15 minutes at room temperature.'
    ],
    reagents: [
      { name: 'TRIzol Reagent', stockConc: '1X', finalConc: '1X', volumePerRxnUl: 1000 },
      { name: 'Chloroform (molecular biology grade)', stockConc: '100%', finalConc: '20% v/v', volumePerRxnUl: 200 },
      { name: 'Isopropanol (100% molecular grade)', stockConc: '100%', finalConc: '50% v/v', volumePerRxnUl: 500 },
      { name: 'Ethanol (fresh 75% in DEPC-water)', stockConc: '75%', finalConc: '75%', volumePerRxnUl: 1000 },
      { name: 'RNase-free DNase I Enzyme', stockConc: '2 U/uL', finalConc: '1 U/rxn', volumePerRxnUl: 2.5 },
      { name: 'Nuclease-free Water (DEPC-treated)', stockConc: '100%', finalConc: '100%', volumePerRxnUl: 50 }
    ],
    steps: [
      {
        id: 's-1',
        order: 1,
        title: 'Cell Lysis & Homogenization',
        instruction: 'Aspirate culture media. Add 1.0 mL TRIzol directly to the 6-well plate or cell pellet (1-5 x 10^6 cells). Pipette up and down 10 times to lyse completely.',
        benchTip: 'Look for lysate becoming clear and viscous. Ensure no cell clumps remain on the plate surface.',
        timerDurationSeconds: 300,
        timerLabel: 'Lysate Room Temp Incubation',
        completed: true
      },
      {
        id: 's-2',
        order: 2,
        title: 'Phase Separation with Chloroform',
        instruction: 'Add 0.2 mL of chloroform. Cap tube securely and shake vigorously by hand for 15 seconds (do not vortex!). Incubate at room temperature for 3 minutes.',
        benchTip: 'Vigorous hand shaking ensures proper partition of proteins and DNA into organic phase. Do not vortex to prevent shearing genomic DNA into aqueous phase.',
        timerDurationSeconds: 180,
        timerLabel: 'Chloroform Bench Rest',
        completed: true
      },
      {
        id: 's-3',
        order: 3,
        title: 'Cold Centrifugation for Phase Partitioning',
        instruction: 'Centrifuge tube at 12,000 x g for 15 minutes at 4°C in the refrigerated benchtop centrifuge.',
        benchTip: 'Ensure centrifuge is pre-cooled to 4°C. The mixture will separate into lower red phenol-chloroform phase, white interphase (DNA), and upper clear aqueous phase (RNA).',
        timerDurationSeconds: 900,
        timerLabel: 'Phase Separation Spin',
        completed: false
      },
      {
        id: 's-4',
        order: 4,
        title: 'Aqueous Phase Collection',
        instruction: 'Transfer upper clear aqueous phase (~450-500 uL) into a fresh RNase-free 1.5 mL tube. Leave 50-100 uL above interphase to avoid organic contamination.',
        benchTip: 'Angle the pipette tip at 45 degrees. It is far better to sacrifice 10% of yield than to contaminate the RNA with phenol-chloroform.',
        completed: false
      },
      {
        id: 's-5',
        order: 5,
        title: 'Isopropanol Precipitation',
        instruction: 'Add 500 uL of 100% isopropanol. Invert gently 8 times. Incubate at -20°C for 20 minutes (or 10 minutes at room temperature).',
        benchTip: 'For low input samples (<100k cells), add 1 uL GlycoBlue coprecipitant to visualize the pellet.',
        timerDurationSeconds: 1200,
        timerLabel: 'Precipitation at -20C',
        completed: false
      },
      {
        id: 's-6',
        order: 6,
        title: 'Pellet Wash with 75% Cold Ethanol',
        instruction: 'Centrifuge at 12,000 x g for 10 min at 4°C. Aspirate supernatant. Add 1.0 mL 75% cold ethanol, vortex briefly, and spin at 7,500 x g for 5 min at 4°C.',
        benchTip: 'Orient hinge of microcentrifuge tube outward so you know exactly where the pellet will be located.',
        timerDurationSeconds: 600,
        timerLabel: 'Pellet Sedimentation Spin',
        completed: false
      },
      {
        id: 's-7',
        order: 7,
        title: 'Air Dry & Elution in Nuclease-Free Water',
        instruction: 'Carefully remove ethanol with P200 then P10 tip. Air-dry tube with cap open for 5 minutes until pellet turns translucent. Resuspend in 30-50 uL nuclease-free water.',
        benchTip: 'Do NOT allow pellet to turn completely chalky white—it will be insoluble and degrade. Warm at 55°C for 3 min if solubilization is sluggish.',
        timerDurationSeconds: 300,
        timerLabel: 'Pellet Air Dry Timer',
        completed: false
      },
      {
        id: 's-8',
        order: 8,
        title: 'NanoDrop & Agilent Bioanalyzer Quality Assessment',
        instruction: 'Measure 1 uL on NanoDrop: verify 260/280 is 1.9-2.1 and 260/230 > 2.0. Run 1 uL on Agilent Bioanalyzer RNA 6000 Nano chip to confirm RIN > 8.0.',
        benchTip: 'If 260/230 is below 1.6, clean up using an RNeasy spin column.',
        completed: false
      }
    ],
    tags: ['RNA-seq', 'TRIzol', 'Extraction', 'Quality Control', 'Bioanalyzer'],
    lastExecuted: '2026-10-23',
    linkedPaperId: 'paper-zheng-2017'
  },
  {
    id: 'proto-pcr-amplification',
    title: 'Dual-Index High-Fidelity PCR Amplification & Agarose Gel Verification',
    category: 'Wet Lab',
    estimatedDurationMin: 90,
    difficulty: 'Standard',
    target: 'Amplify target 480 bp genomic locus with Q5 High-Fidelity DNA Polymerase and confirm crisp single-band specificity on 1.8% agarose gel.',
    expectedOutcomes: 'Sharp 480 bp band on gel without primer-dimer smears or non-specific higher molecular weight concatemers; yield > 30 ng/uL after column clean up.',
    knownShortcomingsAndTroubleshooting: [
      'Primer dimers (<100 bp bright smear): Reduce primer concentration from 0.5 uM to 0.2 uM; raise annealing temperature by 2°C.',
      'No band / Low amplification: Verify GC content; add 5% DMSO or Q5 High GC Enhancer for GC > 65% templates.',
      'Smearing across lane: Over-cycling (>35 cycles) or excess template DNA causing template reannealing.'
    ],
    reagents: [
      { name: '2X Q5 High-Fidelity Master Mix', stockConc: '2X', finalConc: '1X', volumePerRxnUl: 12.5 },
      { name: 'Forward Primer (10 uM stock)', stockConc: '10 uM', finalConc: '0.5 uM', volumePerRxnUl: 1.25 },
      { name: 'Reverse Primer (10 uM stock)', stockConc: '10 uM', finalConc: '0.5 uM', volumePerRxnUl: 1.25 },
      { name: 'Genomic DNA Template (50 ng/uL)', stockConc: '50 ng/uL', finalConc: '100 ng', volumePerRxnUl: 2.0 },
      { name: 'Nuclease-Free Water', stockConc: '100%', finalConc: '100%', volumePerRxnUl: 8.0 }
    ],
    steps: [
      {
        id: 'pcr-1',
        order: 1,
        title: 'Master Mix Preparation on Ice',
        instruction: 'Thaw primers, Q5 master mix, and nuclease-free water on ice. Vortex and pulse-spin. Prepare master mix in 1.5 mL tube for N+1 reactions.',
        benchTip: 'Always prepare 10% extra volume to compensate for pipette wall dead volume.',
        completed: true
      },
      {
        id: 'pcr-2',
        order: 2,
        title: 'Aliquot to 0.2 mL PCR Strip Tubes',
        instruction: 'Aliquot 23 uL master mix into each strip tube. Add 2.0 uL DNA template into respective tubes. Mix by pipetting and spin down.',
        benchTip: 'Include 1 negative control (water instead of DNA) to verify master mix sterility.',
        completed: true
      },
      {
        id: 'pcr-3',
        order: 3,
        title: 'Thermocycler Cycling Run (32 cycles)',
        instruction: 'Run program: 98°C for 30s initial denaturation; then 32 cycles of [98°C 10s -> 64°C 20s -> 72°C 20s]; final extension 72°C 2 min; 4°C hold.',
        benchTip: 'Make sure heated lid is set to 105°C to prevent condensation.',
        timerDurationSeconds: 4200,
        timerLabel: 'PCR Thermal Cycler Run',
        completed: false
      },
      {
        id: 'pcr-4',
        order: 4,
        title: '1.8% Agarose Gel Preparation & Loading',
        instruction: 'Melt 1.8g agarose in 100 mL 1X TAE buffer in microwave. Cool to 55°C. Add 5 uL GelRed stain. Pour into casting tray with 15-well comb.',
        benchTip: 'Allow gel to polymerize for 30 minutes until completely opaque.',
        timerDurationSeconds: 1800,
        timerLabel: 'Agarose Gel Polymerization',
        completed: false
      },
      {
        id: 'pcr-5',
        order: 5,
        title: 'Gel Electrophoresis Run & UV Imaging',
        instruction: 'Load 5 uL 100 bp DNA ladder and 5 uL PCR product mixed with loading dye into wells. Run at 100V constant for 45 minutes.',
        benchTip: 'Check bubbles at electrodes to confirm current flow. Keep eye protection on at UV transilluminator.',
        timerDurationSeconds: 2700,
        timerLabel: 'Gel Electrophoresis 100V',
        completed: false
      }
    ],
    tags: ['PCR', 'Genotyping', 'Gel Electrophoresis', 'Amplification'],
    lastExecuted: '2026-10-24',
    linkedPaperId: 'paper-slaymaker-2016'
  },
  {
    id: 'proto-bioinfo-rna-seq',
    title: 'Differential Expression RNA-seq Pipeline (FastQC -> STAR -> featureCounts -> DESeq2)',
    category: 'Bioinformatics',
    estimatedDurationMin: 180,
    difficulty: 'Demanding',
    target: 'Execute complete end-to-end transcriptomic pipeline from paired-end FASTQ reads to publication-grade volcano plots and gene set enrichment analyses.',
    expectedOutcomes: 'Clean per-base Phred scores > 30 across reads; STAR unique mapping rate > 85%; gene count matrix with > 20,000 features; statistically significant DEGs (padj < 0.05, |log2FC| >= 1.0).',
    knownShortcomingsAndTroubleshooting: [
      'Low STAR mapping rate (<60%): Indicates rRNA contamination, wrong reference genome assembly, or adapter read-through.',
      'High duplicate rate in Picard: PCR over-amplification in low-input library preparation.',
      'Cook\'s distance outlier warnings in DESeq2: Inspect sample PCA plot for mislabeled replicates or batch effects.',
      'Discrepancies in chromosome naming ("chr1" vs "1"): Ensembl vs UCSC GTF header mismatch causing 0 counts in featureCounts.'
    ],
    reagents: [],
    steps: [
      {
        id: 'bio-1',
        order: 1,
        title: 'Raw Read Quality Control (FastQC & MultiQC)',
        instruction: 'Run FastQC on raw paired-end FASTQ files. Aggregate reports with MultiQC to check adapter contamination, GC content, and duplication levels.',
        pipelineCommand: 'fastqc -t 8 -o ./qc_raw/ sample_R1.fq.gz sample_R2.fq.gz && multiqc -o ./qc_raw/ ./qc_raw/',
        benchTip: 'Flag if adapter content exceeds 5% or Phred scores drop below 28 at 3\' read ends.',
        timerDurationSeconds: 900,
        timerLabel: 'FastQC Cluster Execution',
        completed: true
      },
      {
        id: 'bio-2',
        order: 2,
        title: 'Adapter Trimming & Quality Filtering (fastp)',
        instruction: 'Trim residual Illumina universal adapter sequences and filter out reads shorter than 35 bp using fastp.',
        pipelineCommand: 'fastp -i sample_R1.fq.gz -I sample_R2.fq.gz -o trimmed_R1.fq.gz -O trimmed_R2.fq.gz --detect_adapter_for_pe --qualified_quality_phred 20 -h fastp_report.html',
        benchTip: 'fastp automatically detects adapter overlaps in paired-end mode without manual adapter sequence specification.',
        timerDurationSeconds: 1200,
        timerLabel: 'fastp Trimming Job',
        completed: true
      },
      {
        id: 'bio-3',
        order: 3,
        title: 'Spliced Alignment to Human Genome (STAR 2-Pass)',
        instruction: 'Align trimmed paired-end reads to GRCh38 using STAR with two-pass junction detection for high sensitivity.',
        pipelineCommand: 'STAR --runThreadN 16 --genomeDir /data/ref/GRCh38_STAR --readFilesIn trimmed_R1.fq.gz trimmed_R2.fq.gz --readFilesCommand zcat --outSAMtype BAM SortedByCoordinate --twopassMode Basic --quantMode GeneCounts --outFileNamePrefix ./aligned/sample_',
        benchTip: 'Ensure cluster GPU/CPU node has at least 32 GB RAM allocated or STAR will terminate with out-of-memory error.',
        timerDurationSeconds: 3600,
        timerLabel: 'STAR Alignment Run',
        completed: false
      },
      {
        id: 'bio-4',
        order: 4,
        title: 'Exon Feature Counting (Subread featureCounts)',
        instruction: 'Quantify gene-level fragment counts from sorted BAM files against GENCODE v39 annotation.',
        pipelineCommand: 'featureCounts -T 8 -p -B -C -s 2 -a gencode.v39.annotation.gtf -o counts.txt ./aligned/*.bam',
        benchTip: 'Check strand-specificity flag: -s 2 is for standard dUTP stranded RNA-seq libraries.',
        timerDurationSeconds: 1800,
        timerLabel: 'featureCounts Run',
        completed: false
      },
      {
        id: 'bio-5',
        order: 5,
        title: 'Statistical Differential Testing in R (DESeq2)',
        instruction: 'Import counts into DESeq2, perform median-of-ratios normalization, dispersion estimation, Wald testing, and apeglm log fold change shrinkage.',
        pipelineCommand: 'Rscript run_deseq2.R --counts counts.txt --metadata samplesheet.csv --contrast condition_KO_vs_WT --outdir ./deg_results/',
        benchTip: 'Always check PCA plot before testing: replicates must cluster together tightly.',
        timerDurationSeconds: 600,
        timerLabel: 'DESeq2 Analysis Script',
        completed: false
      }
    ],
    tags: ['Bioinformatics', 'RNA-seq', 'STAR', 'DESeq2', 'Nextflow', 'Transcriptomics'],
    lastExecuted: '2026-10-22',
    linkedPaperId: 'paper-love-2014'
  }
];

export const SEED_TARGET_OUTCOMES: TargetOutcomeRecord[] = [
  {
    id: 'to-1',
    targetObjective: 'Achieve >70% on-target editing of BCL11A erythroid enhancer via Cas9 RNP nucleofection',
    hypothesis: 'Pre-complexed Cas9 ribonucleoprotein (RNP) with 100 pmol sgRNA delivered via Lonza 4D-Nucleofector will double editing efficiency compared to plasmid delivery while minimizing exposure duration.',
    linkedProtocolId: 'proto-pcr-amplification',
    linkedPaperIds: ['paper-jinek-2012', 'paper-slaymaker-2016'],
    status: 'In Progress',
    empiricalOutcome: 'Obtained 58.4% on-target indel frequency measured by T7 endonuclease I (T7EI) digestion. Band intensity quantification on Bioanalyzer revealed crisp cleavages at 280 bp and 200 bp.',
    shortcomingsAndPitfalls: [
      'T7EI assay underestimates non-homozygous indels and small 1-2 bp deletions by approximately 15-20%.',
      'Cell viability 24h post-nucleofection dropped to 62% due to electroporation pulse stress (program CA-137).'
    ],
    nextIterationAdjustment: 'Switch from T7EI enzymatic cleavage to targeted amplicon deep sequencing (NGS). Test milder nucleofection code (CM-138) with 10% trehalose osmoprotectant.',
    dateLogged: '2026-10-23',
    sampleBatch: 'Batch #2026-10B-CD34'
  },
  {
    id: 'to-2',
    targetObjective: 'Isolate high-integrity total RNA from primary glioblastoma neurospheres with RIN >= 8.5',
    hypothesis: 'Direct lysis in TRIzol with immediate mechanical bead beating will overcome dense extracellular matrix and prevent hypoxic degradation.',
    linkedProtocolId: 'proto-rna-trizol',
    linkedPaperIds: ['paper-zheng-2017'],
    status: 'Achieved',
    empiricalOutcome: 'Agilent Bioanalyzer RNA 6000 Nano run recorded RIN = 9.2 with distinct 28S/18S ratio of 2.15. NanoDrop A260/280 was 2.04 and A260/230 was 2.18. Total yield: 18.4 ug.',
    shortcomingsAndPitfalls: [
      'Lysate foaming occurred if bead-beating exceeded 30 seconds at 6.0 m/s.',
      'Manual column transfer took 15 minutes longer than planned.'
    ],
    nextIterationAdjustment: 'Cap bead beating at 25 seconds; chill lysis block in -20°C prior to run to prevent thermal RNA nicking.',
    dateLogged: '2026-10-24',
    sampleBatch: 'GBM-NS-Sphere-P4'
  },
  {
    id: 'to-3',
    targetObjective: 'Identify top differentially expressed immune response pathways in Cas9-edited stem cells vs control',
    hypothesis: 'RNA-seq differential expression with STAR + DESeq2 will reveal p53 pathway transcriptional activation in high-DSB edited samples.',
    linkedProtocolId: 'proto-bioinfo-rna-seq',
    linkedPaperIds: ['paper-dobin-2013', 'paper-love-2014'],
    status: 'Blocked by Pitfall',
    empiricalOutcome: 'STAR alignment finished with 89% unique mapping, but DESeq2 PCA revealed sample WT_Rep3 clustered with KO samples due to a sample tube swap during library prep indexing.',
    shortcomingsAndPitfalls: [
      'Sample index swap during dual-index PCR plate transfer.',
      'One replicate had low read depth (6.8 million reads vs 32 million in others).'
    ],
    nextIterationAdjustment: 'Exclude WT_Rep3 from design matrix model; re-sequence duplicate archive library with unique dual indexes (UDIs) to prevent index hopping.',
    dateLogged: '2026-10-25',
    sampleBatch: 'Library-SeqRun-04'
  }
];

export const SEED_LAB_SLOTS: LabSlotBooking[] = [
  {
    id: 'slot-1',
    equipmentName: 'Leica SP8 Confocal Laser Scanning Microscope',
    date: '2026-10-26',
    startTime: '10:00',
    endTime: '12:30',
    bookedBy: 'Sumaiya (Me)',
    projectGoal: '405nm DAPI & 488nm GFP fluorescence z-stack imaging of Cas9 nucleofected neurospheres',
    sampleCount: 8,
    reminderMinutesBefore: 30,
    status: 'Upcoming'
  },
  {
    id: 'slot-2',
    equipmentName: 'Agilent 2100 Bioanalyzer (RNA Nano Chip)',
    date: '2026-10-26',
    startTime: '14:00',
    endTime: '15:15',
    bookedBy: 'Sumaiya (Me)',
    projectGoal: 'Electropherogram verification of 12 RNA extractions prior to NextSeq library prep',
    sampleCount: 12,
    reminderMinutesBefore: 15,
    status: 'Upcoming'
  },
  {
    id: 'slot-3',
    equipmentName: 'Illumina NextSeq 2000 Sequencer (P2 100-cycle Flow Cell)',
    date: '2026-10-28',
    startTime: '09:00',
    endTime: '17:00',
    bookedBy: 'Genomics Core Facility / Sumaiya',
    projectGoal: 'Targeted amplicon deep sequencing of on-target and predicted off-target loci',
    sampleCount: 24,
    reminderMinutesBefore: 60,
    status: 'Upcoming'
  },
  {
    id: 'slot-4',
    equipmentName: 'Beckman Coulter Optima L-90K Ultracentrifuge',
    date: '2026-10-24',
    startTime: '13:00',
    endTime: '16:00',
    bookedBy: 'Sumaiya (Me)',
    projectGoal: 'Sucrose cushion gradient separation of extracellular vesicles',
    sampleCount: 6,
    reminderMinutesBefore: 20,
    status: 'Completed'
  }
];

export const SEED_MOOD_LOGS: MoodLogEntry[] = [
  {
    id: 'mood-1',
    date: '2026-10-21',
    timestamp: 1792582800000,
    moodScore: 4,
    moodLabel: 'Steady Lab Progress',
    energyLevel: 4,
    reflection: 'Ran 2 agarose gels, bands came out super sharp at 480 bp with no primer-dimers! Primer redesign really paid off.',
    labTrigger: 'Clean Gel Band'
  },
  {
    id: 'mood-2',
    date: '2026-10-22',
    timestamp: 1792669200000,
    moodScore: 2,
    moodLabel: 'Contamination Frustration',
    energyLevel: 2,
    reflection: 'Negative control in PCR had faint amplification. Spent 3 hours decontaminating the UV biosafety cabinet, discarding buffers, and ordering new barrier tips.',
    labTrigger: 'Contamination Crisis'
  },
  {
    id: 'mood-3',
    date: '2026-10-23',
    timestamp: 1792755600000,
    moodScore: 3,
    moodLabel: 'Debugging Pipeline',
    energyLevel: 3,
    reflection: 'STAR alignment crashed on the cluster node due to memory allocation error. Fixed SLURM job script to request 48GB instead of 16GB.',
    labTrigger: 'Code/Pipeline Bug'
  },
  {
    id: 'mood-4',
    date: '2026-10-24',
    timestamp: 1792842000000,
    moodScore: 5,
    moodLabel: 'Breakthrough & High Energy',
    energyLevel: 5,
    reflection: 'Agilent Bioanalyzer confirmed RIN = 9.2 for our tricky tissue sample! The RNA isn\'t degraded! Professor was super impressed in our 1-on-1.',
    labTrigger: 'Clean Gel Band'
  },
  {
    id: 'mood-5',
    date: '2026-10-25',
    timestamp: 1792928400000,
    moodScore: 4,
    moodLabel: 'Focused & Synthesizing',
    energyLevel: 4,
    reflection: 'Connecting the dots between Jinek 2012 Cas9 mechanism and Slaymaker 2016 engineered variants for thesis chapter 2.',
    labTrigger: 'Hypothesis Validated'
  }
];

export const SEED_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-1',
    title: 'Aliquot and pre-warm Q5 master mix & forward primers for tomorrow morning\'s PCR',
    category: 'Bench Wet Lab',
    priority: 'Immediate (Today)',
    energyRequired: 'Medium Routine',
    completed: false,
    linkedProtocolId: 'proto-pcr-amplification',
    dueDate: '2026-10-25',
    createdAt: '2026-10-25'
  },
  {
    id: 'act-2',
    title: 'Read Anzalone 2019 pegRNA PBS design rules while 15-min cold spin runs',
    category: 'Paper Reading',
    priority: 'While Incubating',
    energyRequired: 'High Focus',
    completed: false,
    linkedPaperId: 'paper-anzalone-2019',
    createdAt: '2026-10-25'
  },
  {
    id: 'act-3',
    title: 'Submit STAR 2-pass alignment batch script on cluster for the 12 trimmed FASTQ samples',
    category: 'Bioinformatics Pipeline',
    priority: 'Immediate (Today)',
    energyRequired: 'High Focus',
    completed: false,
    linkedProtocolId: 'proto-bioinfo-rna-seq',
    dueDate: '2026-10-25',
    createdAt: '2026-10-25'
  },
  {
    id: 'act-4',
    title: 'Thaw and calibrate Agilent Bioanalyzer RNA 6000 Nano ladder & dye-concentrate',
    category: 'Reagent Prep / Order',
    priority: 'Next Lab Slot',
    energyRequired: 'Medium Routine',
    completed: false,
    linkedProtocolId: 'proto-rna-trizol',
    dueDate: '2026-10-26',
    createdAt: '2026-10-25'
  },
  {
    id: 'act-5',
    title: 'Order fresh 100% molecular biology grade chloroform & RNase Away spray bottle',
    category: 'Reagent Prep / Order',
    priority: 'Weekly Milestone',
    energyRequired: 'Low Energy Quick Win',
    completed: false,
    createdAt: '2026-10-24'
  },
  {
    id: 'act-6',
    title: 'Re-plot DESeq2 volcano plot excluding contaminated sample WT_Rep3',
    category: 'Analysis & Discussion',
    priority: 'Immediate (Today)',
    energyRequired: 'High Focus',
    completed: true,
    linkedPaperId: 'paper-love-2014',
    createdAt: '2026-10-24'
  }
];

export const SEED_DISCARDED_ITEMS: DiscardedItem[] = [
  {
    id: 'discard-wet-1',
    originalId: 'img-crooked-gel-99',
    type: 'wet',
    category: 'figure',
    title: 'Smudged Cas9 Cleavage Agarose Gel (Run 140V)',
    previewText: 'Band migration was warped and blurred due to salt front compression in 1X TAE run too fast at 140V. Deleted for now while re-running at 90V.',
    imageUrl: '/src/assets/images/bio_lab_bench_hero_1792938142791.jpg',
    dataPayload: {
      type: 'figure',
      title: 'Smudged Cas9 Cleavage Agarose Gel (Run 140V)',
      note: 'Re-running with fresh chilled buffer at 90V for 60 min.'
    },
    discardedAt: '2026-10-25',
    parentTitle: 'A Programmable Dual-RNA–Guided DNA Endonuclease in Adaptive Bacterial Immunity'
  },
  {
    id: 'discard-dry-1',
    originalId: 'outcome-tru-grna-04',
    type: 'dry',
    category: 'target_outcome',
    title: 'Negative Result: 17-nt Truncated Guide RNA In Vitro Cleavage',
    previewText: 'Hypothesis was that 17-nt tru-gRNA would maintain robust on-target cleavage while killing off-targets. Result: Cleavage dropped below 3% in vitro at the BCL11A target.',
    dataPayload: {
      target: 'Optimize cleavage specificity using 17-nt truncated guide',
      hypothesis: '17-nt guide has lower thermodynamic stability with non-target strand, preserving on-target cut while ablating off-targets',
      outcome: 'In vitro cleavage fell from 88% down to 2.8% on target BCL11A. Severe loss of activity.'
    },
    discardedAt: '2026-10-22',
    memoryReflection: 'Crucial lab memory: Truncating guide to 17-nt at GC-rich sites (>65% GC) severely disrupts Cas9 R-loop formation. Never design truncated guides for GC-rich targets without first confirming melting profile.',
    tags: ['Negative Result', 'Troubleshooting', 'Cas9 Specificity', 'Lesson Learned'],
    parentTitle: 'Empirical Outcomes Ledger'
  },
  {
    id: 'discard-dry-2',
    originalId: 'run-qc-fail-01',
    type: 'dry',
    category: 'bioinformatics_run',
    title: 'FastQC Adapter Read-Through & Phred Drop in RNA-Seq Batch 1',
    previewText: 'Universal TruSeq adapter dimer was detected in 28.4% of raw reads; Q-score fell below Q20 past cycle 110. Retired to memory vault.',
    imageUrl: '/src/assets/images/rna_seq_flow_visual_1792938142351.jpg',
    dataPayload: {
      pipeline: 'FastQC Quality Assessment',
      sample: 'RNA_Batch_01_HeLa',
      adapterContaminationPercent: 28.4
    },
    discardedAt: '2026-10-23',
    memoryReflection: 'Negative lesson: cDNA library fragments were under-size-selected (<150 bp) and 35 cycles of PCR over-amplified adapter-dimers. We switched to SPRIselect 0.8X right-side bead cleanup which eliminated the dimer artifact.',
    tags: ['Library Prep Lesson', 'Artifact', 'SPRI Clean Up', 'Bioinformatics QC'],
    parentTitle: 'Bioinformatics Pipeline Studio'
  }
];

export const SEED_BIOINFORMATICS_RUNS: BioinformaticsPipelineRun[] = [
  {
    id: 'run-rnaseq-01',
    pipelineName: 'Bulk RNA-Seq: STAR Alignment & DESeq2 Differential Expression',
    category: 'Transcriptomics',
    sampleId: 'CRISPR_KO_vs_Control_Triplicates',
    readType: 'Paired-End 150bp',
    inputFastq: 'data/fastq/HEK293T_Cas9_KO_rep1_R1.fastq.gz, rep1_R2.fastq.gz',
    referenceGenome: 'GRCh38 (Human Ensembl v109)',
    status: 'Completed',
    dateRun: '2026-10-24',
    parameters: {
      threads: '16',
      starIndex: '/ref/star_grch38_2.7.10b',
      padjCutoff: '0.05',
      log2fcCutoff: '1.5',
      quantMode: 'GeneCounts'
    },
    generatedCommands: [
      '# 1. Quality Control & Adapter Trimming',
      'fastp -i HEK293T_Cas9_KO_rep1_R1.fq.gz -I HEK293T_Cas9_KO_rep1_R2.fq.gz -o trimmed_R1.fq.gz -O trimmed_R2.fq.gz --detect_adapter_for_pe -q 30 -w 16',
      '',
      '# 2. Splice-Aware Suffix Array Alignment (STAR)',
      'STAR --genomeDir /ref/star_grch38 --readFilesIn trimmed_R1.fq.gz trimmed_R2.fq.gz --readFilesCommand zcat --runThreadN 16 --outSAMtype BAM SortedByCoordinate --quantMode GeneCounts --outFileNamePrefix ./aligned_star/',
      '',
      '# 3. Differential Expression Analysis (DESeq2 in R)',
      'Rscript -e "library(DESeq2); dds <- DESeqDataSetFromMatrix(countData=cts, colData=coldata, design=~condition); dds <- DESeq(dds); res <- results(dds, contrast=c(\'condition\',\'KO\',\'WT\')); write.csv(as.data.frame(res), file=\'deg_results.csv\')"'
    ],
    summaryOutput: {
      totalReads: '42,810,490',
      mappingRate: '94.6% uniquely mapped',
      detectedGenes: 18452,
      significantHits: 1482,
      q30Percent: 96.2,
      notes: 'Strong upregulation of p53 downstream target genes (CDKN1A, BAX) and repression of embryonic globins.'
    },
    plotImage: '/src/assets/images/rna_seq_flow_visual_1792938142351.jpg',
    linkedWetLabPaperId: 'paper-love-2014',
    linkedWetLabProtocolId: 'proto-bioinfo-rna-seq',
    linkedTargetOutcomeId: 'record-target-1'
  },
  {
    id: 'run-crispresso-02',
    pipelineName: 'CRISPResso2: Deep Targeted Amplicon Indel Profiling',
    category: 'Genomics',
    sampleId: 'Amp_BCL11A_Enhancer_GATA1_Site',
    readType: 'Paired-End 150bp',
    inputFastq: 'data/amplicons/BCL11A_Exon2_R1.fq.gz, BCL11A_Exon2_R2.fq.gz',
    referenceGenome: 'Target Amplicon (280 bp window)',
    status: 'Completed',
    dateRun: '2026-10-23',
    parameters: {
      guideSeq: 'CTAACAGTTGCTTTTATCAC',
      quantWindow: '3 bp upstream of NGG PAM',
      minAverageReadQuality: '30'
    },
    generatedCommands: [
      '# CRISPResso2 targeted indel quantification',
      'CRISPResso --fastq_r1 BCL11A_Amp_R1.fq.gz --fastq_r2 BCL11A_Amp_R2.fq.gz \\',
      '  --amplicon_seq CTGGTGAGTCCCCT...CTAACAGTTGCTTTTATCACTGG...CCTGAAGGCT \\',
      '  --guide_seq CTAACAGTTGCTTTTATCAC \\',
      '  --cleavage_offset -3 \\',
      '  --window_around_cut 10 \\',
      '  --output_folder ./crispresso_bcl11a_out/'
    ],
    summaryOutput: {
      totalReads: '185,200',
      mappingRate: '98.8%',
      detectedGenes: 1,
      significantHits: 1,
      q30Percent: 97.4,
      notes: 'Total editing efficiency: 74.2% (68.1% frameshift indels, 6.1% in-frame deletions). Peak deletion is -1 bp at cleavage junction.'
    },
    plotImage: '/src/assets/images/bio_lab_bench_hero_1792938142791.jpg',
    linkedWetLabPaperId: 'paper-jinek-2012',
    linkedTargetOutcomeId: 'record-target-1'
  },
  {
    id: 'run-gatk-03',
    pipelineName: 'GATK4 HaplotypeCaller: High-Confidence Variant Calling',
    category: 'Genomics',
    sampleId: 'CellLine_Isogenic_Clone_B4',
    readType: 'Paired-End 150bp',
    inputFastq: 'data/fastq/Clone_B4_WGS_R1.fq.gz, Clone_B4_WGS_R2.fq.gz',
    referenceGenome: 'GRCh38 (Human)',
    status: 'Completed',
    dateRun: '2026-10-21',
    parameters: {
      gatkVersion: '4.4.0.0',
      standCallConf: '30',
      emitRefConfidence: 'GVCF'
    },
    generatedCommands: [
      '# 1. Alignment with BWA-MEM',
      'bwa mem -t 16 -R "@RG\\tID:CloneB4\\tSM:CloneB4\\tPL:ILLUMINA" /ref/hg38.fa Clone_B4_R1.fq.gz Clone_B4_R2.fq.gz | samtools sort -@ 8 -o Clone_B4.sorted.bam',
      '',
      '# 2. Mark Duplicates',
      'gatk MarkDuplicates -I Clone_B4.sorted.bam -O Clone_B4.dedup.bam -M metrics.txt --CREATE_INDEX true',
      '',
      '# 3. Variant Calling with HaplotypeCaller',
      'gatk HaplotypeCaller -R /ref/hg38.fa -I Clone_B4.dedup.bam -O Clone_B4.g.vcf.gz -ERC GVCF --native-pair-hmm-threads 16'
    ],
    summaryOutput: {
      totalReads: '98,400,000',
      mappingRate: '99.1%',
      significantHits: 4219,
      q30Percent: 95.8,
      notes: '4,219 high-confidence SNPs/indels called; zero off-target indels detected at predicted CIRCLE-seq genomic loci.'
    },
    plotImage: '/src/assets/images/microscope_confocal_lens_1792938143735.jpg',
    linkedWetLabPaperId: 'paper-slaymaker-2016'
  }
];

