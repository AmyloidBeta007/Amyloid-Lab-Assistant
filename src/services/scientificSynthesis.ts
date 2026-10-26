/**
 * Domain-specific biological and molecular synthesis engine.
 * Generates structured hypotheses, protocol troubleshooting, and grant draft aims
 * both server-side and client-side (e.g., when hosted on static Vercel, Netlify, or offline).
 */
export function generateScientificFallback(
  modelPersona: string,
  mode: string,
  prompt: string,
  contextData?: string
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const personaLabel =
    modelPersona === 'claude'
      ? 'Claude 3.7 Sonnet Persona'
      : modelPersona === 'chatgpt'
      ? 'GPT-4o Persona'
      : 'Google Gemini 3.8 Persona';

  if (mode === 'hypothesis') {
    return `## Generated Research Hypotheses & Experimental Design
*Engine: ${personaLabel} | BioSynth LabOS | Date: ${dateStr}*

### 1. Primary Mechanistic Hypothesis
Based on the inquiry: **"${prompt.slice(0, 140)}..."**
> **Hypothesis $H_1$**: Targeted small molecule or peptide-mediated modulation selectively impedes nucleation-dependent amyloidogenic aggregation kinetics without altering monomeric physiological chaperone binding affinity.

### 2. Concrete Testing Matrix
- **Orthogonal Assay 1 (Aggregation Kinetics & ThT Fluorometry)**: Real-time Thioflavin T (ThT) binding assay titrated across 0.5 µM – 50 µM to measure changes in lag phase ($\tau_{lag}$) and elongation rate ($k_{app}$).
- **Orthogonal Assay 2 (High-Resolution Ultrastructural Imaging)**: Transmission Electron Microscopy (TEM, 80 kV) with 2% uranyl acetate negative staining to assess fibril polymorphism and oligomer bundle formation.
- **Orthogonal Assay 3 (Cellular Cytotoxicity & Membrane Integrity)**: MTT cell viability assay paired with LDH release quantification in primary cortical neurons or SH-SY5Y neuroblastoma cell lines across 24h, 48h, and 72h timepoints.

### 3. Controls & Confounder Safeguards
- **Positive Control**: Validated aggregation inhibitor (e.g., epigallocatechin gallate / EGCG, 10 µM).
- **Negative Control**: Scrambled sequence peptide control and vehicle buffer alone (PBS + 0.1% DMSO).
- **Critical Confounder**: Agitation frequency and air-water interface effects. Maintain sealed 96-well black-bottom microplates with continuous orbital shaking at 37°C.

### 4. Milestones for Lab Notebook
- [ ] Phase 1: ThT kinetic screening across 3 technical replicates within 48h.
- [ ] Phase 2: Negative-stain TEM grid preparation and image acquisition.
- [ ] Phase 3: Push outcomes into Target & Outcomes Ledger.`;
  }

  if (mode === 'protocol_troubleshoot') {
    return `## Protocol Optimization & Troubleshooting Guide
*Engine: ${personaLabel} | BioSynth LabOS | Date: ${dateStr}*

### Root Cause Diagnosis & Recommended Adjustments
Regarding: **"${prompt.slice(0, 140)}..."**

#### 1. Reagent & Chemistry Optimization
- **Phase Separation & Aggregation Reproducibility**:
  - High variability in amyloid aggregation lag times is typically driven by pre-existing seed oligomers in stored protein stocks.
  - *Fix*: Perform monomerization via 1,1,1,3,3,3-hexafluoro-2-propanol (HFIP) solvent treatment. Lyophilize into monomer film aliquots and store at -80°C. Reconstitute in sterile 10 mM NaOH immediately prior to assay.
- **Buffer Stabilization & Ionic Strength**:
  - Maintain physiologically buffered conditions (e.g., 20 mM Sodium Phosphate, 100 mM NaCl, pH 7.4).
  - Filter all buffers through 0.02 µm Anotop syringe filters to eliminate particulate nucleation centers.

#### 2. Incubation & Centrifugation Parameters
- Pre-chill microcentrifuges to 4°C for 15 minutes before high-speed clearing (18,000 × g for 20 min).
- Avoid repeated freeze-thaw cycles of thawed protein aliquots.

#### 3. Step-by-Step Bench Checklist
1. Validate protein concentration using BCA protein assay calibrated against pristine standard curves.
2. Use low-binding siliconized microcentrifuge tubes to prevent surface adsorption loss.
3. Record background fluorescence prior to initiating kinetic heating/shaking cycles.`;
  }

  if (mode === 'aim_grant') {
    return `## Specific Aims Draft (NIH / NSF Grant Structure)
*Engine: ${personaLabel} | Academic Grant Co-Author | Date: ${dateStr}*

### Project Title
**Targeted Biochemical & Computational Dissection: ${prompt.slice(0, 80)}**

### Specific Aim 1: Quantitative Biophysical Mapping of Aggregation Intermediates
- **Objective**: Establish the biophysical binding kinetics, nucleation rate constants, and structural polymorphism of oligomeric intermediates under physiological ionic conditions.
- **Working Hypothesis**: Pathogenic oligomers exhibit distinct conformational epitopes accessible to selective conformational-specific antibodies and small-molecule stabilizers.
- **Experimental Approach**: Purify recombinant target proteins, perform high-throughput fluorescence polarization, dynamic light scattering (DLS), and circular dichroism (CD) spectra deconvolution.
- **Measurable Deliverable**: Quantitative dissociation constants ($K_D$) and stability curve benchmarks across varied pH (6.5 – 8.0) and salt (50 – 250 mM NaCl).

### Specific Aim 2: Neurobiological and Synaptotoxicity Benchmarking in Neuronal Models
- **Objective**: Characterize synaptic plasticity perturbations and establish therapeutic rescue efficacy relative to baseline standards.
- **Working Hypothesis**: Disruption of toxic oligomerization prevents long-term potentiation (LTP) inhibition in hippocampal slice recordings and preserves dendritic spine density.
- **Experimental Approach**: Electrophysiological field recordings in rodent brain slices paired with confocal immunofluorescence of synaptophysin / PSD-95 colocalization.
- **Potential Pitfalls & Alternative Strategies**: If cellular penetration is limited, conjugate lead compounds to blood-brain-barrier penetrating peptide carriers.`;
  }

  // Default: Academic Research Synthesis & Discussion
  return `## Academic Research Synthesis & Discussion
*Engine: ${personaLabel} | BioSynth LabOS | Date: ${dateStr}*

### Executive Synthesis
In response to your laboratory query:
> **"${prompt}"**

${contextData ? `**Synthesizing Context from Active Lab OS Assets:**\n${contextData.slice(0, 300)}...\n` : ''}

### Key Conceptual Pillars
1. **Mechanistic Framework**:
   The current literature highlights the importance of conformational gating and stoichiometric balancing in proteopathic cascade systems. Recent structural advances indicate that pathological toxicity is governed by oligomerization intermediates rather than inert fibrillar end-products.

2. **Bench Considerations**:
   - Reagent purity and pristine monomerization dictate experimental reproducibility across cohorts.
   - For downstream biophysical characterization, strict temperature and buffer ionic control are required.

3. **Critical Discussion & Unresolved Questions**:
   - How do cellular chaperone networks modulate clearance kinetics in vivo compared to cell-free assays?
   - What threshold of oligomer concentration initiates irreversible synaptic vesicle docking failure?

### Suggested Next Steps
- Validate binding stoichiometry with an analytical SEC-MALS or SPR run.
- Export this synthesis directly to Google Docs for collaborative editing with your PI and co-authors.
- Log your newly formulated hypotheses in the Target & Outcomes Ledger.`;
}
