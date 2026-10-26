import React, { useState } from 'react';
import { TargetOutcomeRecord, Protocol, ResearchPaper, DiscardedItem, DiscardType } from '../types';
import { Target, CheckCircle2, AlertTriangle, ArrowRight, Plus, Trash2, Filter } from 'lucide-react';
import { DiscardButton } from './DiscardButton';
import { DiscardActionModal } from './DiscardActionModal';

interface TargetOutcomesMatrixProps {
  records: TargetOutcomeRecord[];
  protocols: Protocol[];
  papers: ResearchPaper[];
  onAddRecord: (record: TargetOutcomeRecord) => void;
  onUpdateRecord: (record: TargetOutcomeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onNavigateToProtocol: (protocolId: string) => void;
  onDiscardRecord?: (discardedItem: DiscardedItem) => void;
}

export const TargetOutcomesMatrix: React.FC<TargetOutcomesMatrixProps> = ({
  records,
  protocols,
  papers,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onNavigateToProtocol,
  onDiscardRecord
}) => {
  const [discardModalState, setDiscardModalState] = useState<{
    type: DiscardType;
    record: TargetOutcomeRecord;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const filteredRecords = records.filter(r => {
    if (filterStatus === 'All') return true;
    return r.status === filterStatus;
  });

  const statusColors: Record<TargetOutcomeRecord['status'], { badge: string; border: string }> = {
    'Achieved': { badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' },
    'In Progress': { badge: 'bg-teal-100 text-teal-800', border: 'border-teal-300' },
    'Inconclusive': { badge: 'bg-amber-100 text-amber-800', border: 'border-amber-300' },
    'Blocked by Pitfall': { badge: 'bg-rose-100 text-rose-800', border: 'border-rose-300' }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Target, Outcomes & Shortcomings Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empirical research ledger mapping scientific hypotheses to real lab outcomes and actionable troubleshooting pivots.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            {['All', 'Achieved', 'In Progress', 'Blocked by Pitfall', 'Inconclusive'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Log Experiment</span>
          </button>
        </div>
      </div>

      {/* Grid of Experiment Dossiers */}
      <div className="grid grid-cols-1 gap-5">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8 text-xs text-slate-500">
            No experiment records match the selected filter.
          </div>
        ) : (
          filteredRecords.map(record => {
            const linkedProto = protocols.find(p => p.id === record.linkedProtocolId);
            const style = statusColors[record.status];

            return (
              <div
                key={record.id}
                className={`bg-white border ${style.border} rounded-xl p-5 shadow-xs space-y-4`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${style.badge}`}>
                      {record.status}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Logged {record.dateLogged}
                    </span>
                    {record.sampleBatch && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {record.sampleBatch}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={record.status}
                      onChange={e => onUpdateRecord({ ...record, status: e.target.value as TargetOutcomeRecord['status'] })}
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 font-medium"
                      aria-label="Update experiment status"
                    >
                      <option value="In Progress">In Progress</option>
                      <option value="Achieved">Achieved</option>
                      <option value="Inconclusive">Inconclusive</option>
                      <option value="Blocked by Pitfall">Blocked by Pitfall</option>
                    </select>

                    <DiscardButton
                      onDiscard={type => setDiscardModalState({ type, record })}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Target Objective & Hypothesis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wide block mb-1">
                      Target Objective
                    </span>
                    <p className="text-xs text-slate-900 font-semibold leading-relaxed">
                      {record.targetObjective}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1">
                      Scientific Hypothesis
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {record.hypothesis}
                    </p>
                  </div>
                </div>

                {/* Empirical Outcome */}
                <div className="bg-white p-3.5 rounded-lg border border-teal-200 bg-teal-50/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      Empirical Observed Outcome (Data & Measurements)
                    </span>
                    {linkedProto && (
                      <button
                        onClick={() => onNavigateToProtocol(linkedProto.id)}
                        className="text-xs text-teal-700 hover:text-teal-900 underline font-medium text-left"
                      >
                        Protocol: {linkedProto.title}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-mono">
                    {record.empiricalOutcome}
                  </p>
                </div>

                {/* Shortcomings & Next Iteration Adjustment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50/60 p-3.5 rounded-lg border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Shortcomings & Pitfalls Encountered
                    </span>
                    <ul className="space-y-1 text-xs text-slate-800">
                      {record.shortcomingsAndPitfalls.map((pitfall, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-700 font-bold">•</span>
                          <span>{pitfall}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 text-white p-3.5 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1 mb-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                      Next Iteration Adjustment (Troubleshooting Tweak)
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {record.nextIterationAdjustment}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddExperimentModal
          protocols={protocols}
          papers={papers}
          onClose={() => setShowAddModal(false)}
          onAdd={rec => {
            onAddRecord(rec);
            setShowAddModal(false);
          }}
        />
      )}

      {/* Discard Action Modal (Wet vs Dry Discard) */}
      {discardModalState && (
        <DiscardActionModal
          type={discardModalState.type}
          category="target_outcome"
          itemId={discardModalState.record.id}
          itemTitle={discardModalState.record.targetObjective}
          itemPreviewText={discardModalState.record.empiricalOutcome}
          parentTitle="Empirical Outcomes Ledger"
          onClose={() => setDiscardModalState(null)}
          onConfirmDiscard={discardedItem => {
            if (onDiscardRecord) {
              onDiscardRecord(discardedItem);
            }
            onDeleteRecord(discardModalState.record.id);
            setDiscardModalState(null);
          }}
        />
      )}
    </div>
  );
};

interface AddExperimentModalProps {
  protocols: Protocol[];
  papers: ResearchPaper[];
  onClose: () => void;
  onAdd: (record: TargetOutcomeRecord) => void;
}

const AddExperimentModal: React.FC<AddExperimentModalProps> = ({
  protocols,
  papers,
  onClose,
  onAdd
}) => {
  const [targetObjective, setTargetObjective] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [linkedProtocolId, setLinkedProtocolId] = useState(protocols[0]?.id || '');
  const [sampleBatch, setSampleBatch] = useState('');
  const [empiricalOutcome, setEmpiricalOutcome] = useState('');
  const [pitfalls, setPitfalls] = useState('');
  const [nextAdjustment, setNextAdjustment] = useState('');
  const [status, setStatus] = useState<TargetOutcomeRecord['status']>('In Progress');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetObjective.trim()) return;

    const record: TargetOutcomeRecord = {
      id: `to-${Date.now()}`,
      targetObjective: targetObjective.trim(),
      hypothesis: hypothesis.trim() || 'Validate expected biological phenotype under calibrated conditions.',
      linkedProtocolId: linkedProtocolId || undefined,
      linkedPaperIds: [],
      status,
      empiricalOutcome: empiricalOutcome.trim() || 'Assay run pending analytical measurement.',
      shortcomingsAndPitfalls: pitfalls
        .split('\n')
        .map(p => p.trim())
        .filter(Boolean),
      nextIterationAdjustment: nextAdjustment.trim() || 'Analyze replicates and optimize parameters.',
      dateLogged: new Date().toISOString().split('T')[0],
      sampleBatch: sampleBatch.trim() || undefined
    };

    onAdd(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Log New Research Target & Outcome
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Objective *</label>
            <input
              type="text"
              required
              value={targetObjective}
              onChange={e => setTargetObjective(e.target.value)}
              placeholder="e.g. Achieve >65% PCR amplification yield of target locus..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Biological Hypothesis</label>
            <textarea
              value={hypothesis}
              onChange={e => setHypothesis(e.target.value)}
              rows={2}
              placeholder="What did you hypothesize would happen?"
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Linked Protocol</label>
              <select
                value={linkedProtocolId}
                onChange={e => setLinkedProtocolId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">None / Custom</option>
                {protocols.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sample Batch / ID</label>
              <input
                type="text"
                value={sampleBatch}
                onChange={e => setSampleBatch(e.target.value)}
                placeholder="e.g. Batch-2026-Oct-P1"
                className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Empirical Outcome (What happened?)</label>
            <textarea
              value={empiricalOutcome}
              onChange={e => setEmpiricalOutcome(e.target.value)}
              rows={2}
              placeholder="Record exact measurements: band size, NanoDrop 260/280, RIN score, mapping %..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Shortcomings & Pitfalls (One per line)</label>
            <textarea
              value={pitfalls}
              onChange={e => setPitfalls(e.target.value)}
              rows={2}
              placeholder="Enter any troubleshooting hurdles or pitfalls encountered..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Next Iteration Adjustment</label>
            <input
              type="text"
              value={nextAdjustment}
              onChange={e => setNextAdjustment(e.target.value)}
              placeholder="What tweak will you make next time?"
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TargetOutcomeRecord['status'])}
              className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="In Progress">In Progress</option>
              <option value="Achieved">Achieved</option>
              <option value="Inconclusive">Inconclusive</option>
              <option value="Blocked by Pitfall">Blocked by Pitfall</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-medium">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
              Save Experiment Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
