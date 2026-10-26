import React, { useState } from 'react';
import { ProtocolReagent } from '../types';
import { calculateDilution, calculateMasterMix } from '../utils/bioMath';
import { Calculator, Beaker, Check, Plus, Trash2 } from 'lucide-react';

interface ReagentCalculatorModalProps {
  initialReagents?: ProtocolReagent[];
  onClose: () => void;
}

export const ReagentCalculatorModal: React.FC<ReagentCalculatorModalProps> = ({
  initialReagents = [],
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'mastermix' | 'dilution'>('mastermix');

  // Master mix state
  const [reactionsCount, setReactionsCount] = useState<number>(8);
  const [overagePercent, setOveragePercent] = useState<number>(10);
  const [mixReagents, setMixReagents] = useState<Array<{ name: string; volumePerRxnUl: number }>>(
    initialReagents.length > 0
      ? initialReagents.map(r => ({ name: r.name, volumePerRxnUl: r.volumePerRxnUl }))
      : [
          { name: '2X Polymerase Master Mix', volumePerRxnUl: 12.5 },
          { name: 'Forward Primer (10 µM)', volumePerRxnUl: 1.25 },
          { name: 'Reverse Primer (10 µM)', volumePerRxnUl: 1.25 },
          { name: 'DNA Template', volumePerRxnUl: 2.0 },
          { name: 'Nuclease-free Water', volumePerRxnUl: 8.0 }
        ]
  );
  const [newReagentName, setNewReagentName] = useState('');
  const [newReagentVol, setNewReagentVol] = useState<number>(1.0);

  // Dilution state (C1 V1 = C2 V2)
  const [c1, setC1] = useState<number>(100);
  const [c2, setC2] = useState<number>(10);
  const [v2, setV2] = useState<number>(50);
  const [concUnit, setConcUnit] = useState<string>('µM');
  const [volUnit, setVolUnit] = useState<string>('µL');

  const dilutionResult = calculateDilution(c1, c2, v2);
  const masterMixScaled = calculateMasterMix(mixReagents, reactionsCount, overagePercent);
  const totalVolumePerRxn = mixReagents.reduce((acc, r) => acc + r.volumePerRxnUl, 0);
  const grandTotalMixVolume = masterMixScaled.reduce((acc, r) => acc + r.totalUl, 0);

  const handleAddMixReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReagentName.trim() || newReagentVol <= 0) return;
    setMixReagents([...mixReagents, { name: newReagentName.trim(), volumePerRxnUl: newReagentVol }]);
    setNewReagentName('');
    setNewReagentVol(1.0);
  };

  const handleRemoveMixReagent = (idx: number) => {
    setMixReagents(mixReagents.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              Laboratory Reagent & Master Mix Calculator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('mastermix')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              activeTab === 'mastermix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PCR / Reaction Master Mix Batcher
          </button>
          <button
            onClick={() => setActiveTab('dilution')}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              activeTab === 'dilution' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Molarity & Dilution (C1V1 = C2V2)
          </button>
        </div>

        {activeTab === 'mastermix' ? (
          <div className="space-y-4 text-xs">
            {/* Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Number of Reactions (N)</label>
                <input
                  type="number"
                  min={1}
                  value={reactionsCount}
                  onChange={e => setReactionsCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-bold text-teal-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pipetting Overage / Loss (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={overagePercent}
                  onChange={e => setOveragePercent(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-bold text-slate-800"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block font-semibold text-slate-700 mb-1">Effective Reaction Multiplier</label>
                <div className="py-1.5 px-2 bg-slate-200/60 rounded font-mono font-bold text-slate-700">
                  {(reactionsCount * (1 + overagePercent / 100)).toFixed(1)}×
                </div>
              </div>
            </div>

            {/* Scaled Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-2.5 font-semibold text-slate-700">Reagent / Component</th>
                    <th className="p-2.5 font-semibold text-slate-700 text-right">1 Rxn (µL)</th>
                    <th className="p-2.5 font-semibold text-teal-900 bg-teal-50 text-right">
                      Batch Total for {reactionsCount} Rxns (+{overagePercent}%)
                    </th>
                    <th className="p-2.5 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-mono">
                  {masterMixScaled.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-sans font-medium text-slate-800">{item.name}</td>
                      <td className="p-2.5 text-right text-slate-600">{item.perRxn.toFixed(2)} µL</td>
                      <td className="p-2.5 text-right font-bold text-teal-700 bg-teal-50/40">
                        {item.totalUl.toFixed(2)} µL
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMixReagent(idx)}
                          className="text-slate-300 hover:text-rose-600 p-0.5"
                          aria-label="Remove reagent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-2.5 font-sans text-slate-900">Total Volume per Aliquot & Master Mix</td>
                    <td className="p-2.5 text-right text-slate-900">{totalVolumePerRxn.toFixed(2)} µL</td>
                    <td className="p-2.5 text-right text-teal-900 bg-teal-100/70">
                      {grandTotalMixVolume.toFixed(2)} µL
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add Reagent Row */}
            <form onSubmit={handleAddMixReagent} className="flex gap-2">
              <input
                type="text"
                value={newReagentName}
                onChange={e => setNewReagentName(e.target.value)}
                placeholder="Component name (e.g. 10mM dNTPs)..."
                className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={newReagentVol}
                onChange={e => setNewReagentVol(Number(e.target.value))}
                placeholder="µL per rxn"
                className="w-28 px-2.5 py-1.5 border border-slate-200 rounded font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors shrink-0"
              >
                Add Row
              </button>
            </form>
          </div>
        ) : (
          /* Dilution Calculator */
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Calculate the required stock volume (V₁) and diluent buffer (V_diluent) to prepare target concentration (C₂) in volume (V₂).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* C1 Stock */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Stock Concentration (C₁)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    value={c1}
                    onChange={e => setC1(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={concUnit}
                    onChange={e => setConcUnit(e.target.value)}
                    className="w-16 px-1.5 py-1.5 bg-white border border-slate-200 rounded text-center font-mono"
                  />
                </div>
              </div>

              {/* C2 Target */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Target Concentration (C₂)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    value={c2}
                    onChange={e => setC2(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-bold"
                  />
                  <span className="w-16 py-1.5 text-center text-slate-500 font-mono flex items-center justify-center">
                    {concUnit}
                  </span>
                </div>
              </div>

              {/* V2 Target */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Target Final Volume (V₂)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    value={v2}
                    onChange={e => setV2(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={volUnit}
                    onChange={e => setVolUnit(e.target.value)}
                    className="w-16 px-1.5 py-1.5 bg-white border border-slate-200 rounded text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Result Box */}
            {dilutionResult.isValid ? (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-slate-800 space-y-2">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Pipetting Recipe
                </span>
                <div className="grid grid-cols-2 gap-4 pt-1 font-mono">
                  <div className="bg-white p-3 rounded-lg border border-teal-200">
                    <span className="text-[11px] text-slate-500 block font-sans">1. Stock Solution (V₁)</span>
                    <span className="text-xl font-bold text-teal-800">{dilutionResult.v1Stock} {volUnit}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-teal-200">
                    <span className="text-[11px] text-slate-500 block font-sans">2. Buffer / Diluent Volume</span>
                    <span className="text-xl font-bold text-slate-900">{dilutionResult.vDiluent} {volUnit}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 font-sans mt-2">
                  Mix <strong className="text-teal-900">{dilutionResult.v1Stock} {volUnit}</strong> of {c1} {concUnit} stock with <strong className="text-slate-900">{dilutionResult.vDiluent} {volUnit}</strong> of buffer/water to yield {v2} {volUnit} at {c2} {concUnit}.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                {dilutionResult.errorMessage}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
