import React, { useState } from 'react';
import { Droplets, Archive, AlertCircle, Sparkles, X, Check } from 'lucide-react';
import { DiscardType, DiscardItemCategory, DiscardedItem } from '../types';

interface DiscardActionModalProps {
  type: DiscardType;
  category: DiscardItemCategory;
  itemId: string;
  itemTitle: string;
  itemPreviewText?: string;
  itemImageUrl?: string;
  parentTitle?: string;
  onClose: () => void;
  onConfirmDiscard: (discardedItem: DiscardedItem) => void;
}

const COMMON_TAGS = [
  'Negative Result',
  'Protocol Troubleshooting',
  'Superseded by New Run',
  'Technical Artifact',
  'Off-Target Cleavage',
  'Low Yield / Degraded',
  'Unexpected Phenotype',
  'Lesson Learned'
];

export const DiscardActionModal: React.FC<DiscardActionModalProps> = ({
  type,
  category,
  itemId,
  itemTitle,
  itemPreviewText,
  itemImageUrl,
  parentTitle,
  onClose,
  onConfirmDiscard
}) => {
  const [selectedType, setSelectedType] = useState<DiscardType>(type);
  const [memoryReflection, setMemoryReflection] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    type === 'dry' ? ['Negative Result', 'Lesson Learned'] : []
  );

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleConfirm = () => {
    const discarded: DiscardedItem = {
      id: `discard-${Date.now()}`,
      originalId: itemId,
      type: selectedType,
      category,
      title: itemTitle,
      previewText: itemPreviewText,
      imageUrl: itemImageUrl,
      dataPayload: {
        id: itemId,
        title: itemTitle,
        previewText: itemPreviewText,
        imageUrl: itemImageUrl,
        category
      },
      discardedAt: new Date().toISOString().split('T')[0],
      memoryReflection: selectedType === 'dry' ? (memoryReflection.trim() || 'Archived to scientific memory vault for future troubleshooting reference.') : undefined,
      tags: selectedType === 'dry' ? selectedTags : undefined,
      parentTitle
    };

    onConfirmDiscard(discarded);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-white shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {selectedType === 'wet' ? (
              <div className="p-2 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800">
                <Droplets className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-800">
                <Archive className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-white">
                {selectedType === 'wet' ? 'Wet Discard: Quarantine Item' : 'Dry Discard: Retire to Lab Memory'}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedType === 'wet'
                  ? 'Temporarily remove from workbench — restorable anytime'
                  : 'Preserve permanently as a scientific lesson or negative result'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSelectedType('wet')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
              selectedType === 'wet'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Wet Discard (Delete for now)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('dry')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
              selectedType === 'dry'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Dry Discard (Keep as memory)</span>
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="uppercase text-teal-400">{category.replace('_', ' ')}</span>
            {parentTitle && <span className="truncate max-w-[260px] text-slate-500">From: {parentTitle}</span>}
          </div>
          <div className="flex items-start gap-3">
            {itemImageUrl && (
              <img
                src={itemImageUrl}
                alt={itemTitle}
                className="w-16 h-16 object-cover rounded-lg border border-slate-800 bg-black shrink-0"
              />
            )}
            <div className="space-y-1 min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-100 truncate">{itemTitle}</h4>
              {itemPreviewText && (
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {itemPreviewText}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Specific Discard Mode Guidance */}
        {selectedType === 'wet' ? (
          <div className="p-3.5 bg-cyan-950/30 border border-cyan-900/60 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Wet Discard Principle: "Deleting for now"</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In lab practice, wet bio-waste or unneeded data is swept off the active bench. This item will be placed in the <strong>Wet Discard Quarantine</strong>. You can retrieve and restore it to its exact location whenever you want, or incinerate it permanently later.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-semibold">
                <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dry Discard Principle: "Don't want forever, but keep as memory"</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Negative results, failed primer combinations, and superseded pipeline runs are goldmines of scientific memory. Storing it in the <strong>Dry Discard Vault</strong> ensures you and your lab never repeat the same pitfall twice.
              </p>
            </div>

            {/* Reflection / Post-Mortem Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 block flex items-center justify-between">
                <span>Memory Reflection & Scientific Post-Mortem:</span>
                <span className="text-[10px] text-amber-400 font-mono">Why did we retire this?</span>
              </label>
              <textarea
                value={memoryReflection}
                onChange={e => setMemoryReflection(e.target.value)}
                placeholder="Log why this result/image was decommissioned (e.g. Non-specific amplicon formed at 55°C annealing; primer dimer artifact; superseded by run #2)..."
                rows={3}
                className="w-full text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
              />
            </div>

            {/* Scientific Memory Tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Classify Scientific Lesson:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              selectedType === 'wet'
                ? 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950'
            }`}
          >
            {selectedType === 'wet' ? (
              <>
                <Droplets className="w-3.5 h-3.5" />
                <span>Move to Wet Discard (Quarantine)</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5" />
                <span>Archive to Dry Discard Memory Vault</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
