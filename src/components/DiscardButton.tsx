import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Archive, Droplets, ChevronDown } from 'lucide-react';
import { DiscardType } from '../types';

interface DiscardButtonProps {
  onDiscard: (type: DiscardType) => void;
  label?: string;
  size?: 'sm' | 'md';
  variant?: 'subtle' | 'outline' | 'danger';
}

export const DiscardButton: React.FC<DiscardButtonProps> = ({
  onDiscard,
  label = 'Discard',
  size = 'sm',
  variant = 'subtle'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = size === 'sm'
    ? 'text-[11px] py-1 px-2 gap-1'
    : 'text-xs py-1.5 px-3 gap-1.5';

  const variantClasses = variant === 'danger'
    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
    : variant === 'outline'
    ? 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-slate-200 bg-white">
        {/* Quick primary Wet Discard trigger */}
        <button
          type="button"
          onClick={() => onDiscard('wet')}
          className={`inline-flex items-center font-medium transition-colors text-slate-700 hover:text-rose-700 hover:bg-rose-50/60 ${sizeClasses}`}
          title="Wet Discard: Delete for now (Quarantine/Soft Trash)"
        >
          <Droplets className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span>Wet Discard</span>
        </button>

        {/* Dropdown toggle for Dry Discard or choice */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-1.5 border-l border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors flex items-center justify-center`}
          aria-label="More discard options"
          aria-expanded={isOpen}
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Discard Choice Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-slate-950 text-white border border-slate-800 rounded-xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
            Laboratory Discard Protocol
          </div>

          {/* Wet Discard Option */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDiscard('wet');
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-slate-900 transition-colors flex items-start gap-2.5 group cursor-pointer"
          >
            <div className="p-1.5 bg-cyan-950 text-cyan-400 rounded-md border border-cyan-800/60 group-hover:bg-cyan-900 shrink-0 mt-0.5">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-cyan-200 flex items-center gap-1.5">
                <span>Wet Discard</span>
                <span className="text-[10px] font-normal text-slate-400">· Soft Trash</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                "I am deleting this data/result for now." Quarantined, restorable anytime.
              </p>
            </div>
          </button>

          {/* Dry Discard Option */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDiscard('dry');
            }}
            className="w-full text-left p-2 rounded-lg hover:bg-slate-900 transition-colors flex items-start gap-2.5 group cursor-pointer"
          >
            <div className="p-1.5 bg-amber-950 text-amber-400 rounded-md border border-amber-800/60 group-hover:bg-amber-900 shrink-0 mt-0.5">
              <Archive className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
                <span>Dry Discard</span>
                <span className="text-[10px] font-normal text-slate-400">· Memory Vault</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                "I don't want the result forever, but wanna keep it as a memory." Log lessons & negative results.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
