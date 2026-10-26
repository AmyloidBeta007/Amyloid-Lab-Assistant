import React from 'react';
import { RotateCcw, AlertTriangle, Sparkles, X, Trash2 } from 'lucide-react';

interface RestartConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestartAll: () => void;
  onConfirmResetScratchpad: () => void;
  ideasCount: number;
}

export const RestartConfirmModal: React.FC<RestartConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmRestartAll,
  onConfirmResetScratchpad,
  ideasCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-dialog-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-rose-50/70 via-slate-50 to-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 id="restart-dialog-title" className="text-base font-bold text-slate-900">
                Restart & Start Afresh
              </h3>
              <p className="text-xs text-slate-500">
                Reset brainstorm session and clear idea history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              You currently have <strong className="font-bold">{ideasCount} generated {ideasCount === 1 ? 'idea' : 'ideas'}</strong> in your history. Restarting allows you to discard old hypotheses and begin with a clean laboratory slate.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-slate-800 text-xs uppercase tracking-wider">
              Choose Restart Scope:
            </p>

            {/* Option 1: Complete Fresh Start */}
            <button
              onClick={() => {
                onConfirmRestartAll();
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl border-2 border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 transition-all group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Delete All Ideas & Start Afresh</span>
                  <span className="text-[10px] uppercase font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                    Full Reset
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Purges all {ideasCount} saved drafts, resets inputs, clears active context, and starts completely afresh.
                </p>
              </div>
            </button>

            {/* Option 2: Clear Current Scratchpad Only */}
            <button
              onClick={() => {
                onConfirmResetScratchpad();
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 transition-all group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-slate-200 text-slate-700 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  Clear Editor Only (Keep History)
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clears the active prompt and text editor to compose a new idea while preserving prior drafts in your history.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
