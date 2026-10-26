import React, { useState } from 'react';
import { ActionItem, ResearchPaper, Protocol } from '../types';
import {
  ListTodo, CheckCircle2, Clock, Plus, Trash2,
  ArrowRight, Sparkles, Filter, ExternalLink, Zap
} from 'lucide-react';

interface WhatToDoNextProps {
  items: ActionItem[];
  papers: ResearchPaper[];
  protocols: Protocol[];
  onToggleItem: (id: string) => void;
  onAddItem: (item: ActionItem) => void;
  onDeleteItem: (id: string) => void;
  onNavigateToPaper: (paperId: string) => void;
  onNavigateToProtocol: (protocolId: string) => void;
}

export const WhatToDoNext: React.FC<WhatToDoNextProps> = ({
  items,
  papers,
  protocols,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onNavigateToPaper,
  onNavigateToProtocol
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterEnergy, setFilterEnergy] = useState<string>('All');

  // Fast Brain Dump State
  const [dumpTitle, setDumpTitle] = useState('');
  const [dumpCategory, setDumpCategory] = useState<ActionItem['category']>('Bench Wet Lab');
  const [dumpPriority, setDumpPriority] = useState<ActionItem['priority']>('Immediate (Today)');
  const [dumpEnergy, setDumpEnergy] = useState<ActionItem['energyRequired']>('Medium Routine');
  const [dumpLinkedPaperId, setDumpLinkedPaperId] = useState('');
  const [dumpLinkedProtocolId, setDumpLinkedProtocolId] = useState('');

  const handleAddBrainDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dumpTitle.trim()) return;

    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      title: dumpTitle.trim(),
      category: dumpCategory,
      priority: dumpPriority,
      energyRequired: dumpEnergy,
      completed: false,
      linkedPaperId: dumpLinkedPaperId || undefined,
      linkedProtocolId: dumpLinkedProtocolId || undefined,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddItem(newItem);
    setDumpTitle('');
    setDumpLinkedPaperId('');
    setDumpLinkedProtocolId('');
  };

  const filteredItems = items.filter(item => {
    const matchesPriority = filterPriority === 'All' || item.priority === filterPriority;
    const matchesEnergy = filterEnergy === 'All' || item.energyRequired === filterEnergy;
    return matchesPriority && matchesEnergy;
  });

  const priorityGroups: Array<{ label: ActionItem['priority']; desc: string; color: string }> = [
    { label: 'Immediate (Today)', desc: 'Must happen today before cells overgrow or samples degrade', color: 'border-rose-300 bg-rose-50/20' },
    { label: 'While Incubating', desc: 'Prime 15-45 minute tasks during centrifuge or incubation spins', color: 'border-amber-300 bg-amber-50/20' },
    { label: 'Next Lab Slot', desc: 'Preparation for reserved core instruments (Confocal, Bioanalyzer, Sequencer)', color: 'border-teal-300 bg-teal-50/20' },
    { label: 'Weekly Milestone', desc: 'Inventory reorders, committee meetings, figure drafting', color: 'border-slate-300 bg-slate-50/40' }
  ];

  return (
    <div className="space-y-6">
      {/* Header and Fast Brain Dump Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                "What To Do Next" Lab Action Radar
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Turn mental chaos into prioritized lab actions. Filter tasks by time or energy level so you never stall at the bench.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              aria-label="Filter Priority"
            >
              <option value="All">All Priorities</option>
              <option value="Immediate (Today)">Immediate (Today)</option>
              <option value="While Incubating">While Incubating</option>
              <option value="Next Lab Slot">Next Lab Slot</option>
              <option value="Weekly Milestone">Weekly Milestone</option>
            </select>

            <select
              value={filterEnergy}
              onChange={e => setFilterEnergy(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
              aria-label="Filter Energy Level"
            >
              <option value="All">All Energy Levels</option>
              <option value="High Focus">High Focus Only</option>
              <option value="Medium Routine">Medium Routine Only</option>
              <option value="Low Energy Quick Win">Low Energy Quick Wins</option>
            </select>
          </div>
        </div>

        {/* Fast Brain-Dump Form */}
        <form onSubmit={handleAddBrainDump} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Fast Brain-Dump: Clear Your Head Into An Actionable Item</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              required
              value={dumpTitle}
              onChange={e => setDumpTitle(e.target.value)}
              placeholder="What needs to happen next? (e.g. Thaw restriction buffer, run FastQC on replicate 2, read Anzalone pegRNA note)..."
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
            />
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              Add Action
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Category</label>
              <select
                value={dumpCategory}
                onChange={e => setDumpCategory(e.target.value as ActionItem['category'])}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
              >
                <option value="Bench Wet Lab">Bench Wet Lab</option>
                <option value="Bioinformatics Pipeline">Bioinformatics Pipeline</option>
                <option value="Paper Reading">Paper Reading</option>
                <option value="Reagent Prep / Order">Reagent Prep / Order</option>
                <option value="Analysis & Discussion">Analysis & Discussion</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Priority / Timing</label>
              <select
                value={dumpPriority}
                onChange={e => setDumpPriority(e.target.value as ActionItem['priority'])}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 font-medium"
              >
                <option value="Immediate (Today)">Immediate (Today)</option>
                <option value="While Incubating">While Incubating</option>
                <option value="Next Lab Slot">Next Lab Slot</option>
                <option value="Weekly Milestone">Weekly Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Energy Level</label>
              <select
                value={dumpEnergy}
                onChange={e => setDumpEnergy(e.target.value as ActionItem['energyRequired'])}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700"
              >
                <option value="High Focus">High Focus</option>
                <option value="Medium Routine">Medium Routine</option>
                <option value="Low Energy Quick Win">Low Energy Quick Win</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Link to Paper (Optional)</label>
              <select
                value={dumpLinkedPaperId}
                onChange={e => setDumpLinkedPaperId(e.target.value)}
                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 truncate"
              >
                <option value="">None</option>
                {papers.map(p => (
                  <option key={p.id} value={p.id}>{p.authors.split(',')[0]} ({p.year})</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Priority Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {priorityGroups.map(group => {
          const groupItems = filteredItems.filter(i => i.priority === group.label);
          return (
            <div
              key={group.label}
              className={`border ${group.color} rounded-xl p-5 space-y-3 bg-white shadow-xs`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{group.label}</span>
                    <span className="text-xs font-mono font-normal text-slate-400">
                      ({groupItems.length})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{group.desc}</p>
                </div>
              </div>

              {groupItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No pending tasks in this category.
                </p>
              ) : (
                <div className="space-y-2">
                  {groupItems.map(item => {
                    const linkedPaper = papers.find(p => p.id === item.linkedPaperId);
                    const linkedProto = protocols.find(p => p.id === item.linkedProtocolId);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border transition-all text-xs flex items-start justify-between gap-3 ${
                          item.completed
                            ? 'bg-emerald-50/40 border-emerald-200 opacity-60'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <label className="flex items-start gap-2.5 cursor-pointer flex-1 select-none">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => onToggleItem(item.id)}
                            className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="space-y-1 flex-1">
                            <span className={`text-xs font-semibold leading-snug block ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {item.title}
                            </span>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-mono text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                                {item.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={`font-medium ${
                                item.energyRequired === 'High Focus'
                                  ? 'text-purple-700'
                                  : item.energyRequired === 'Low Energy Quick Win'
                                  ? 'text-emerald-700'
                                  : 'text-slate-600'
                              }`}>
                                {item.energyRequired}
                              </span>
                            </div>

                            {/* Direct link tags */}
                            {(linkedPaper || linkedProto) && (
                              <div className="flex items-center gap-2 pt-1">
                                {linkedPaper && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToPaper(linkedPaper.id)}
                                    className="text-[10px] text-teal-700 hover:underline flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>Paper: {linkedPaper.authors.split(',')[0]} ({linkedPaper.year})</span>
                                  </button>
                                )}
                                {linkedProto && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToProtocol(linkedProto.id)}
                                    className="text-[10px] text-teal-700 hover:underline flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>Protocol: {linkedProto.title}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="text-slate-300 hover:text-rose-600 p-0.5 shrink-0"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
