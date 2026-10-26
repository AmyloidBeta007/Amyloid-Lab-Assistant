import React, { useState } from 'react';
import { Protocol, ProtocolStep, ProtocolReagent } from '../types';
import { computeProtocolMetrics, formatTimeSeconds } from '../utils/bioMath';
import {
  FlaskConical, Terminal, CheckCircle, Clock, Play, Plus,
  Trash2, Copy, Check, AlertCircle, Sparkles, ChevronRight, Calculator
} from 'lucide-react';

interface ProtocolBuilderProps {
  protocols: Protocol[];
  selectedProtocolId: string;
  onSelectProtocol: (id: string) => void;
  onUpdateProtocol: (protocol: Protocol) => void;
  onAddProtocol: (protocol: Protocol) => void;
  onDeleteProtocol: (id: string) => void;
  onLaunchTimer: (name: string, durationSeconds: number, stepTitle: string) => void;
  onOpenReagentCalculator: (reagents: ProtocolReagent[]) => void;
}

export const ProtocolBuilder: React.FC<ProtocolBuilderProps> = ({
  protocols,
  selectedProtocolId,
  onSelectProtocol,
  onUpdateProtocol,
  onAddProtocol,
  onDeleteProtocol,
  onLaunchTimer,
  onOpenReagentCalculator
}) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'Wet Lab' | 'Bioinformatics' | 'Hybrid Protocol'>('All');
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepInstruction, setNewStepInstruction] = useState('');
  const [newStepTimerMin, setNewStepTimerMin] = useState(0);
  const [newStepBenchTip, setNewStepBenchTip] = useState('');
  const [newStepCommand, setNewStepCommand] = useState('');

  const currentProtocol = protocols.find(p => p.id === selectedProtocolId) || protocols[0];

  const filteredProtocols = protocols.filter(p => {
    if (filterCategory === 'All') return true;
    return p.category === filterCategory;
  });

  const metrics = currentProtocol
    ? computeProtocolMetrics(currentProtocol.steps)
    : { totalSteps: 0, completedSteps: 0, percent: 0, remainingDurationMinutes: 0 };

  const handleToggleStep = (stepId: string) => {
    if (!currentProtocol) return;
    const updatedSteps = currentProtocol.steps.map(s => {
      if (s.id === stepId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });
    onUpdateProtocol({
      ...currentProtocol,
      steps: updatedSteps
    });
  };

  const handleResetSteps = () => {
    if (!currentProtocol) return;
    const reset = currentProtocol.steps.map(s => ({ ...s, completed: false }));
    onUpdateProtocol({
      ...currentProtocol,
      steps: reset
    });
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim() || !currentProtocol) return;
    const newStep: ProtocolStep = {
      id: `step-${Date.now()}`,
      order: currentProtocol.steps.length + 1,
      title: newStepTitle.trim(),
      instruction: newStepInstruction.trim(),
      benchTip: newStepBenchTip.trim() || undefined,
      timerDurationSeconds: newStepTimerMin > 0 ? newStepTimerMin * 60 : undefined,
      timerLabel: newStepTimerMin > 0 ? newStepTitle.trim() : undefined,
      pipelineCommand: newStepCommand.trim() || undefined,
      completed: false
    };
    onUpdateProtocol({
      ...currentProtocol,
      steps: [...currentProtocol.steps, newStep]
    });
    setNewStepTitle('');
    setNewStepInstruction('');
    setNewStepTimerMin(0);
    setNewStepBenchTip('');
    setNewStepCommand('');
  };

  const handleDeleteStep = (stepId: string) => {
    if (!currentProtocol) return;
    onUpdateProtocol({
      ...currentProtocol,
      steps: currentProtocol.steps.filter(s => s.id !== stepId)
    });
  };

  const handleCopyCommand = (command: string, id: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommandId(id);
    setTimeout(() => setCopiedCommandId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white p-6 sm:p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/src/assets/images/bio_lab_bench_hero_1792938142791.jpg"
            alt="Molecular Biology Lab Bench"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-300 mb-2">
            <span>LAB PROTOCOL BUILDER & RUNNER</span>
            <span aria-hidden="true">·</span>
            <span>WET LAB & BIOINFORMATICS WORKFLOWS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Step-by-Step Bench Protocols & Computational Pipelines
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Execute protocols with live step timers, bench tips, master-mix calculators, and bioinformatic CLI command blocks.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Protocols List (4 cols) & Right Active Execution Card (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Protocol Explorer */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-teal-600" />
              <span>Protocols ({filteredProtocols.length})</span>
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Protocol</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            {(['All', 'Wet Lab', 'Bioinformatics'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex-1 py-1 rounded font-medium transition-colors ${
                  filterCategory === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Protocol Cards */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredProtocols.map(proto => {
              const isSelected = currentProtocol && currentProtocol.id === proto.id;
              const protoMetrics = computeProtocolMetrics(proto.steps);
              return (
                <button
                  key={proto.id}
                  onClick={() => onSelectProtocol(proto.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      {proto.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      ~{proto.estimatedDurationMin} min
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 leading-snug">
                    {proto.title}
                  </h3>

                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${protoMetrics.percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                    <span>{protoMetrics.completedSteps}/{protoMetrics.totalSteps} steps completed</span>
                    <span className="font-mono font-semibold text-teal-700">{protoMetrics.percent}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Protocol Lab Execution Runner */}
        {currentProtocol ? (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            {/* Header info */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-teal-700">{currentProtocol.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Est: {currentProtocol.estimatedDurationMin} min</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-600 font-medium">Difficulty: {currentProtocol.difficulty}</span>
                </div>

                <div className="flex items-center gap-2">
                  {currentProtocol.reagents.length > 0 && (
                    <button
                      onClick={() => onOpenReagentCalculator(currentProtocol.reagents)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 transition-colors"
                      title="Calculate dilutions and master mix batching"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Reagent Calculator</span>
                    </button>
                  )}

                  <button
                    onClick={handleResetSteps}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
                  >
                    Reset Checkboxes
                  </button>

                  <button
                    onClick={() => onDeleteProtocol(currentProtocol.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    aria-label="Delete protocol"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {currentProtocol.title}
              </h2>

              {/* Progress HUD */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-700">
                    Execution Progress: <strong className="text-teal-700 font-mono">{metrics.completedSteps}</strong> of <strong className="font-mono">{metrics.totalSteps}</strong> steps
                  </span>
                  <span className="font-mono text-teal-800 font-bold">
                    {metrics.percent}% {metrics.percent === 100 ? '✓ Complete' : `· ~${metrics.remainingDurationMinutes} min remaining`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${metrics.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Target & Expected Outcomes & Pitfalls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wide block">
                  Target & Expected Outcomes
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">
                  <strong className="text-slate-900">Target:</strong> {currentProtocol.target}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed pt-1 border-t border-slate-200/60">
                  <strong className="text-slate-900">Outcomes:</strong> {currentProtocol.expectedOutcomes}
                </p>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3.5 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Known Shortcomings & Troubleshooting
                </span>
                <ul className="text-xs text-slate-800 space-y-1">
                  {currentProtocol.knownShortcomingsAndTroubleshooting.map((pitfall, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-700 font-bold">•</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step-by-Step Bench Checklist */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Protocol Steps ({currentProtocol.steps.length})</span>
                <span className="text-xs text-slate-500 font-normal">Check off as you pipette or execute</span>
              </h3>

              <div className="space-y-3">
                {currentProtocol.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-4 rounded-xl border transition-all ${
                      step.completed
                        ? 'border-emerald-300 bg-emerald-50/30 opacity-75'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox and Step Title */}
                      <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                        <input
                          type="checkbox"
                          checked={step.completed}
                          onChange={() => handleToggleStep(step.id)}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-teal-700">
                              STEP {idx + 1}
                            </span>
                            <h4 className={`text-sm font-bold text-slate-900 ${step.completed ? 'line-through text-slate-500' : ''}`}>
                              {step.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {step.instruction}
                          </p>

                          {/* Bench Tip Callout */}
                          {step.benchTip && (
                            <div className="mt-2 p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span><strong>Bench Tip:</strong> {step.benchTip}</span>
                            </div>
                          )}

                          {/* Pipeline CLI command block for bioinformatics */}
                          {step.pipelineCommand && (
                            <div className="mt-2 relative bg-slate-900 rounded-lg p-3 text-white font-mono text-[11px]">
                              <div className="flex items-center justify-between mb-1 text-slate-400 text-[10px]">
                                <span className="flex items-center gap-1">
                                  <Terminal className="w-3 h-3 text-teal-400" />
                                  <span>Shell Command</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCommand(step.pipelineCommand!, step.id)}
                                  className="text-slate-300 hover:text-white flex items-center gap-1 font-sans text-[10px]"
                                >
                                  {copiedCommandId === step.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-teal-200">
                                {step.pipelineCommand}
                              </pre>
                            </div>
                          )}
                        </div>
                      </label>

                      {/* Right controls: Launch timer & delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        {step.timerDurationSeconds && (
                          <button
                            type="button"
                            onClick={() => onLaunchTimer(
                              step.timerLabel || step.title,
                              step.timerDurationSeconds!,
                              step.title
                            )}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-800 rounded-lg hover:bg-teal-100 transition-colors"
                            title="Start concurrent bench timer"
                          >
                            <Play className="w-3 h-3 fill-teal-700" />
                            <span className="font-mono">{formatTimeSeconds(step.timerDurationSeconds)}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteStep(step.id)}
                          className="text-slate-300 hover:text-rose-600 p-1"
                          aria-label="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Step Form */}
                <form onSubmit={handleAddStep} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Add Step to Protocol
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={newStepTitle}
                      onChange={e => setNewStepTitle(e.target.value)}
                      placeholder="Step Title (e.g. Centrifuge Pellet)..."
                      className="sm:col-span-2 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                      type="number"
                      min={0}
                      value={newStepTimerMin || ''}
                      onChange={e => setNewStepTimerMin(Number(e.target.value))}
                      placeholder="Timer Duration (mins)"
                      className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <textarea
                    required
                    value={newStepInstruction}
                    onChange={e => setNewStepInstruction(e.target.value)}
                    rows={2}
                    placeholder="Exact instructions, rpm, reagent volume, temperature..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newStepBenchTip}
                      onChange={e => setNewStepBenchTip(e.target.value)}
                      placeholder="Bench tip (optional, e.g. Keep on ice)..."
                      className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <input
                      type="text"
                      value={newStepCommand}
                      onChange={e => setNewStepCommand(e.target.value)}
                      placeholder="CLI/Bash command (optional)..."
                      className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Append Step
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Add Protocol Modal */}
      {showAddModal && (
        <AddProtocolModal
          onClose={() => setShowAddModal(false)}
          onAdd={newP => {
            onAddProtocol(newP);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

interface AddProtocolModalProps {
  onClose: () => void;
  onAdd: (protocol: Protocol) => void;
}

const AddProtocolModal: React.FC<AddProtocolModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Protocol['category']>('Wet Lab');
  const [estimatedDurationMin, setEstimatedDurationMin] = useState(60);
  const [difficulty, setDifficulty] = useState<Protocol['difficulty']>('Standard');
  const [target, setTarget] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProto: Protocol = {
      id: `proto-${Date.now()}`,
      title: title.trim(),
      category,
      estimatedDurationMin: Number(estimatedDurationMin) || 60,
      difficulty,
      target: target.trim() || 'Execute targeted assay with reproducible standards.',
      expectedOutcomes: expectedOutcomes.trim() || 'High quality analytical output verified by gel or sequencing.',
      knownShortcomingsAndTroubleshooting: [
        'Ensure reagents are freshly thawed and mixed thoroughly.',
        'Record sample batch numbers in the target matrix.'
      ],
      reagents: [],
      steps: [
        {
          id: `step-${Date.now()}-1`,
          order: 1,
          title: 'Prepare Reagents & Tubes',
          instruction: 'Label tubes clearly, thaw components on ice, and sanitize pipettes.',
          timerDurationSeconds: 300,
          timerLabel: 'Setup Thaw Timer',
          completed: false
        }
      ],
      tags: [category]
    };

    onAdd(newProto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Create New Protocol</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Protocol Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lentivirus Transduction & Puromycin Selection..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Protocol['category'])}
                className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white"
              >
                <option value="Wet Lab">Wet Lab</option>
                <option value="Bioinformatics">Bioinformatics</option>
                <option value="Hybrid Protocol">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Est Duration (min)</label>
              <input
                type="number"
                value={estimatedDurationMin}
                onChange={e => setEstimatedDurationMin(Number(e.target.value))}
                className="w-full px-2 py-1.5 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Protocol['difficulty'])}
                className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white"
              >
                <option value="Standard">Standard</option>
                <option value="Demanding">Demanding</option>
                <option value="Critical Precision">Critical Precision</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Objective</label>
            <textarea
              value={target}
              onChange={e => setTarget(e.target.value)}
              rows={2}
              placeholder="What is the goal of this protocol?"
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expected Outcomes</label>
            <textarea
              value={expectedOutcomes}
              onChange={e => setExpectedOutcomes(e.target.value)}
              rows={2}
              placeholder="What qualitative or quantitative outcome confirms success?"
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-medium">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
              Save Protocol
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
