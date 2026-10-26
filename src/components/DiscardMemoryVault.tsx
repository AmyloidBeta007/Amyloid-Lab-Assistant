import React, { useState } from 'react';
import {
  Droplets, Archive, RotateCcw, Trash2, Search, Filter,
  Sparkles, ExternalLink, Download, FileText, Check, AlertTriangle, Eye
} from 'lucide-react';
import { DiscardedItem, DiscardType, DiscardItemCategory } from '../types';
import { filterDiscardedItems } from '../utils/bioMath';

interface DiscardMemoryVaultProps {
  discardedItems: DiscardedItem[];
  onRestoreItem: (item: DiscardedItem) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyWetDiscard: () => void;
  onUpdateMemoryReflection: (id: string, newReflection: string) => void;
}

export const DiscardMemoryVault: React.FC<DiscardMemoryVaultProps> = ({
  discardedItems,
  onRestoreItem,
  onPermanentDelete,
  onEmptyWetDiscard,
  onUpdateMemoryReflection
}) => {
  const [activeType, setActiveType] = useState<DiscardType>('dry'); // Default to dry memory vault or wet
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editReflectionText, setEditReflectionText] = useState('');
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const wetItems = discardedItems.filter(i => i.type === 'wet');
  const dryItems = discardedItems.filter(i => i.type === 'dry');

  const displayedItems = filterDiscardedItems(
    discardedItems,
    activeType,
    categoryFilter,
    searchQuery
  );

  const handleStartEditMemory = (item: DiscardedItem) => {
    setEditingMemoryId(item.id);
    setEditReflectionText(item.memoryReflection || '');
  };

  const handleSaveMemory = (id: string) => {
    onUpdateMemoryReflection(id, editReflectionText);
    setEditingMemoryId(null);
  };

  const handleExportCompendium = () => {
    const memoryData = dryItems.map(item => ({
      title: item.title,
      category: item.category,
      discardedAt: item.discardedAt,
      memoryReflection: item.memoryReflection,
      tags: item.tags,
      parentContext: item.parentTitle
    }));

    const blob = new Blob([JSON.stringify(memoryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biosynth-negative-results-memory-vault-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const categoryLabels: Record<DiscardItemCategory, string> = {
    figure: 'Gel & Microscope Figure',
    finding: 'Key Finding / Metric',
    target_outcome: 'Empirical Experiment Outcome',
    bioinformatics_run: 'Bioinformatics Pipeline Run',
    protocol: 'Laboratory Protocol',
    paper: 'Research Paper Dossier'
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-white p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span>BIOHAZARD & MEMORY PROTOCOL</span>
            <span aria-hidden="true">·</span>
            <span>WET & DRY DISCARD ARCHITECTURE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Scientific Discard & Negative Results Memory Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Distinguish between <strong>Wet Discard</strong> ("deleted for now in quarantine") and <strong>Dry Discard</strong> ("retired from active protocols forever, but preserved as permanent lab memory & lessons learned").
          </p>
        </div>
      </div>

      {/* Top Toggle Switcher: Wet Discard vs Dry Discard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {/* Wet Discard Tab */}
          <button
            type="button"
            onClick={() => setActiveType('wet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeType === 'wet'
                ? 'bg-cyan-600 text-slate-950 shadow-md shadow-cyan-900/30 ring-2 ring-cyan-500/50'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4 text-cyan-700" />
            <span>Wet Discard Quarantine</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
              activeType === 'wet' ? 'bg-cyan-950 text-cyan-200' : 'bg-slate-100 text-slate-700'
            }`}>
              {wetItems.length}
            </span>
          </button>

          {/* Dry Discard Tab */}
          <button
            type="button"
            onClick={() => setActiveType('dry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeType === 'dry'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30 ring-2 ring-amber-400/50'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Archive className="w-4 h-4 text-amber-800" />
            <span>Dry Discard Memory Vault</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-extrabold ${
              activeType === 'dry' ? 'bg-amber-950 text-amber-200' : 'bg-slate-100 text-slate-700'
            }`}>
              {dryItems.length}
            </span>
          </button>
        </div>

        {/* Action button for active mode */}
        <div className="flex items-center gap-2">
          {activeType === 'wet' && wetItems.length > 0 && (
            <button
              type="button"
              onClick={onEmptyWetDiscard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Wet Discard Bin</span>
            </button>
          )}

          {activeType === 'dry' && dryItems.length > 0 && (
            <button
              type="button"
              onClick={handleExportCompendium}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Export Memory Compendium (.json)</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeType === 'wet' ? 'quarantined items' : 'memory vault by lesson, failure note, title'}...`}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['all', 'figure', 'target_outcome', 'bioinformatics_run', 'finding'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'All Items' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Item List / Grid */}
      {displayedItems.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
          {activeType === 'wet' ? (
            <>
              <Droplets className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Wet Discard Quarantine is Empty</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When you choose "Wet Discard" on a gel photo, research finding, or outcome, it will be kept safely in quarantine here. You can retrieve it anytime.
              </p>
            </>
          ) : (
            <>
              <Archive className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Memory Vault is Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Whenever an experiment yields a negative result, primer dimer, or unexpected shortcoming, use <strong>Dry Discard</strong> to retire the data while preserving the lesson learned forever.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedItems.map(item => (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all p-5 shadow-xs ${
                item.type === 'wet'
                  ? 'bg-white border-cyan-200 hover:border-cyan-400'
                  : 'bg-slate-950 text-white border-amber-900/60 hover:border-amber-700/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left section: Category, Title, Source Context */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      item.type === 'wet'
                        ? 'bg-cyan-100 text-cyan-900'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {categoryLabels[item.category] || item.category}
                    </span>

                    <span className={item.type === 'wet' ? 'text-slate-400' : 'text-slate-500'}>
                      Discarded on {item.discardedAt}
                    </span>

                    {item.parentTitle && (
                      <span className={`truncate max-w-[280px] ${item.type === 'wet' ? 'text-slate-500' : 'text-slate-400'}`}>
                        · {item.parentTitle}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm sm:text-base font-bold ${
                    item.type === 'wet' ? 'text-slate-900' : 'text-amber-100'
                  }`}>
                    {item.title}
                  </h3>

                  {item.previewText && (
                    <p className={`text-xs leading-relaxed ${
                      item.type === 'wet' ? 'text-slate-600' : 'text-slate-300'
                    }`}>
                      {item.previewText}
                    </p>
                  )}

                  {/* Dry Discard Memory Reflection / Scientific Post-Mortem */}
                  {item.type === 'dry' && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Scientific Memory & Negative Result Lesson:</span>
                        </span>
                        {editingMemoryId !== item.id && (
                          <button
                            type="button"
                            onClick={() => handleStartEditMemory(item)}
                            className="text-[11px] text-amber-400 hover:text-amber-200 underline font-normal"
                          >
                            Edit Note
                          </button>
                        )}
                      </div>

                      {editingMemoryId === item.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={editReflectionText}
                            onChange={e => setEditReflectionText(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-2.5 bg-slate-900 border border-amber-700 rounded-lg text-slate-100 focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingMemoryId(null)}
                              className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveMemory(item.id)}
                              className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-400"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-100/90 leading-relaxed italic">
                          "{item.memoryReflection || 'Archived without note.'}"
                        </p>
                      )}

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.tags.map(t => (
                            <span
                              key={t}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700/50"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side: Thumbnail preview and Action Buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  {item.imageUrl && (
                    <div
                      onClick={() => setPreviewImageModal(item.imageUrl!)}
                      className="w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-black cursor-pointer group relative flex items-center justify-center shrink-0"
                      title="Click to view full image"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Restore Button */}
                    <button
                      type="button"
                      onClick={() => onRestoreItem(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        item.type === 'wet'
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-xs'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs'
                      }`}
                      title={item.type === 'wet' ? 'Restore back to active workbench' : 'Revive result back to active workspace'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{item.type === 'wet' ? 'Restore to Bench' : 'Revive to Active'}</span>
                    </button>

                    {/* Permanent Delete Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Permanently delete "${item.title}"? This cannot be recovered.`)) {
                          onPermanentDelete(item.id);
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        item.type === 'wet'
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-500 hover:text-rose-400 hover:bg-slate-900'
                      }`}
                      title="Permanently incinerate"
                      aria-label="Permanently delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-Size Image Preview Modal */}
      {previewImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xs p-4">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-cyan-400">DISCARD ARCHIVE FIGURE PREVIEW</span>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-auto p-2 bg-black rounded-xl">
              <img
                src={previewImageModal}
                alt="Discarded artifact preview"
                className="max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Copy Notification Toast */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>Scientific Memory Compendium downloaded successfully!</span>
        </div>
      )}
    </div>
  );
};
