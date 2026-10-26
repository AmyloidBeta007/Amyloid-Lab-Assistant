import React, { useState, useRef, useEffect } from 'react';
import { Timer, Sparkles, Sun, Palette, Check, RotateCcw, Eye } from 'lucide-react';

export type NavTab =
  | 'papers'
  | 'protocols'
  | 'bioinformatics'
  | 'targets'
  | 'ai-studio'
  | 'discards'
  | 'timers'
  | 'actions';

export type LabTheme = 'white' | 'sepia' | 'black' | 'pink';

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickTimerOpen: () => void;
  activeTimersCount: number;
  wetDiscardCount?: number;
  dryDiscardCount?: number;
  theme: LabTheme;
  onThemeChange: (theme: LabTheme) => void;
  brightness: number;
  onBrightnessChange: (brightness: number) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onQuickTimerOpen,
  activeTimersCount,
  wetDiscardCount = 0,
  dryDiscardCount = 0,
  theme,
  onThemeChange,
  brightness,
  onBrightnessChange
}) => {
  const totalDiscards = wetDiscardCount + dryDiscardCount;
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close display settings popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowDisplaySettings(false);
      }
    }
    if (showDisplaySettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDisplaySettings]);

  const themes: { id: LabTheme; label: string; tag: string; description: string; previewBg: string; borderCol: string }[] = [
    {
      id: 'white',
      label: 'White',
      tag: 'Clinical',
      description: 'Clean high-contrast laboratory daylight',
      previewBg: 'bg-white',
      borderCol: 'border-slate-300'
    },
    {
      id: 'sepia',
      label: 'Sepia',
      tag: 'Eye Soothing',
      description: 'Warm low-blue-light paper filter for reduced eye fatigue',
      previewBg: 'bg-[#f5eedc]',
      borderCol: 'border-[#dfcca9]'
    },
    {
      id: 'black',
      label: 'Black',
      tag: 'Obsidian',
      description: 'Deep true black mode for darkrooms & night shifts',
      previewBg: 'bg-[#09090b]',
      borderCol: 'border-zinc-700'
    },
    {
      id: 'pink',
      label: 'Pink',
      tag: 'Pastel Rose',
      description: 'Soft blush aesthetic with gentle berry accents',
      previewBg: 'bg-[#fff0f3]',
      borderCol: 'border-pink-300'
    }
  ];

  const brightnessPresets = [
    { value: 70, label: '70% Dim' },
    { value: 85, label: '85% Mellow' },
    { value: 100, label: '100% Standard' },
    { value: 115, label: '115% Bright' },
    { value: 130, label: '130% Max' }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1) > button:nth-of-type(1) */}
        <button
          onClick={() => onTabChange('papers')}
          className="flex items-center gap-2.5 text-left text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 rounded-lg p-1 -ml-1 hover:bg-slate-100/70 shrink-0"
          aria-label="Amyloid Lab Assistant Home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-600 via-indigo-600 to-rose-500 p-0.5 shadow-sm shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center">
              <span className="text-[11px] font-black tracking-tighter text-teal-300">ALA</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
              Amyloid Lab Assistant
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider uppercase">
              Amyloid & Proteopathy Research OS
            </span>
          </div>
        </button>

        {/* Zone 2: Concise single-line nav links with hover underlines */}
        <nav className="hidden xl:flex items-center gap-4 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('papers')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'papers'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Papers & Citations
          </button>

          <button
            onClick={() => onTabChange('protocols')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'protocols'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Wet Protocols
          </button>

          {/* Bioinformatics (Separated Dry Lab) */}
          <button
            onClick={() => onTabChange('bioinformatics')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'bioinformatics'
                ? 'text-emerald-700 font-bold border-b-2 border-emerald-600'
                : 'text-slate-700 hover:text-emerald-600 font-medium'
            }`}
          >
            <span>Bioinformatics Studio</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-900 text-emerald-300 font-bold uppercase">
              Dry Lab
            </span>
          </button>

          <button
            onClick={() => onTabChange('targets')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'targets'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Targets & Outcomes
          </button>

          {/* AI Writing, Brainstorm & Google Docs Export */}
          <button
            onClick={() => onTabChange('ai-studio')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'ai-studio'
                ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                : 'text-slate-700 hover:text-indigo-600 font-medium'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Brainstorm</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold uppercase border border-indigo-200">
              Docs
            </span>
          </button>

          {/* Discard & Memory Vault */}
          <button
            onClick={() => onTabChange('discards')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'discards'
                ? 'text-amber-700 font-bold border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            <span>Discard Vault</span>
            {totalDiscards > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 font-bold">
                {totalDiscards}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('timers')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'timers'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Timers & Slots
          </button>

          <button
            onClick={() => onTabChange('actions')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'actions'
                ? 'text-teal-700 font-semibold border-b-2 border-teal-600'
                : 'hover:text-slate-900'
            }`}
          >
            Mood & Actions
          </button>
        </nav>

        {/* Zone 3: Display Controls (Background Colors & Brightness) + Quick Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick-switch background color chips */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                title={`${t.label} Background ${t.tag ? `(${t.tag})` : ''}`}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${t.previewBg} ${t.borderCol} border ${
                  theme === t.id
                    ? 'ring-2 ring-teal-600 ring-offset-1 scale-105 shadow-xs'
                    : 'opacity-75 hover:opacity-100 hover:scale-105'
                }`}
              >
                {theme === t.id && (
                  <Check className={`w-3 h-3 ${t.id === 'black' ? 'text-white' : 'text-slate-800'}`} />
                )}
              </button>
            ))}
          </div>

          {/* Display & Brightness Popover Trigger */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setShowDisplaySettings(!showDisplaySettings)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                showDisplaySettings
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Change Background Color & Brightness"
              aria-label="Display & Brightness Settings"
            >
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline capitalize">{theme}</span>
              <span className="text-slate-300">·</span>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-[11px]">{brightness}%</span>
            </button>

            {/* Display Settings Floating Modal */}
            {showDisplaySettings && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">Display & Eye Comfort</h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                    Live
                  </span>
                </div>

                {/* Section 1: Background Color Options */}
                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-600 block mb-2">
                    Background Color Theme:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => onThemeChange(t.id)}
                        className={`text-left p-2.5 rounded-lg border transition-all relative ${t.previewBg} ${
                          theme === t.id
                            ? 'ring-2 ring-teal-600 border-teal-600 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              t.id === 'black' ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {t.label}
                          </span>
                          {theme === t.id && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                t.id === 'black' ? 'text-teal-400' : 'text-teal-600'
                              }`}
                            />
                          )}
                        </div>
                        <div
                          className={`text-[10px] font-medium mt-0.5 ${
                            t.id === 'black' ? 'text-zinc-400' : 'text-slate-500'
                          }`}
                        >
                          {t.tag}
                        </div>
                        {t.id === 'sepia' && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded font-medium">
                            <Eye className="w-2.5 h-2.5" />
                            <span>eye soothing filter</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section 2: Brightness Options */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-500" />
                      <label htmlFor="brightness-slider" className="text-xs font-semibold text-slate-700">
                        Workspace Brightness
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {brightness}%
                      </span>
                      {brightness !== 100 && (
                        <button
                          onClick={() => onBrightnessChange(100)}
                          title="Reset to 100%"
                          className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    id="brightness-slider"
                    type="range"
                    min="70"
                    max="130"
                    step="5"
                    value={brightness}
                    onChange={e => onBrightnessChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-5 gap-1 mt-2.5">
                    {brightnessPresets.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => onBrightnessChange(preset.value)}
                        className={`py-1 text-[10px] font-medium rounded border transition-colors ${
                          brightness === preset.value
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Adjusts visual luminance for microscopy rooms, late shifts, or high-glare environments.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Bench Timer */}
          <button
            onClick={onQuickTimerOpen}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-teal-600"
            aria-label="Open Bench Multi-Timer"
          >
            <Timer className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Timer</span>
            {activeTimersCount > 0 && (
              <span className="font-mono text-[10px] bg-teal-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                {activeTimersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Responsive mobile/tablet horizontal scroll row */}
      <div className="xl:hidden flex items-center justify-between border-t border-slate-100 px-4 py-2 bg-slate-50 overflow-x-auto text-xs font-medium gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onTabChange('papers')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'papers' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600'}`}
          >
            Papers
          </button>
          <button
            onClick={() => onTabChange('protocols')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'protocols' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600'}`}
          >
            Protocols
          </button>
          <button
            onClick={() => onTabChange('bioinformatics')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'bioinformatics' ? 'bg-slate-900 text-emerald-300 shadow-sm font-bold' : 'text-slate-700 font-semibold'}`}
          >
            Bioinformatics
          </button>
          <button
            onClick={() => onTabChange('targets')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'targets' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600'}`}
          >
            Targets
          </button>
          <button
            onClick={() => onTabChange('ai-studio')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'ai-studio' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-indigo-700 font-semibold bg-indigo-50'}`}
          >
            AI Brainstorm & Docs
          </button>
          <button
            onClick={() => onTabChange('discards')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'discards' ? 'bg-amber-100 text-amber-900 shadow-sm font-bold' : 'text-slate-600'}`}
          >
            Discard ({totalDiscards})
          </button>
          <button
            onClick={() => onTabChange('timers')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'timers' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600'}`}
          >
            Timers
          </button>
          <button
            onClick={() => onTabChange('actions')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'actions' ? 'bg-white text-teal-700 shadow-sm font-semibold' : 'text-slate-600'}`}
          >
            Actions
          </button>
        </div>

        {/* Mobile color toggles */}
        <div className="flex sm:hidden items-center gap-1 shrink-0 pl-2 border-l border-slate-200">
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              className={`w-5 h-5 rounded-full border ${t.previewBg} ${t.borderCol} ${
                theme === t.id ? 'ring-2 ring-teal-500 scale-110' : 'opacity-70'
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  );
};
