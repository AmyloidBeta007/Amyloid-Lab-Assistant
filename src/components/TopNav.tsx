import React, { useState, useRef, useEffect } from 'react';
import {
  Timer,
  Sparkles,
  Sun,
  Palette,
  Check,
  RotateCcw,
  Eye,
  User as UserIcon,
  Users,
  LogOut,
  Cloud,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';
import { LocalResearcherProfile } from '../types';

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
  currentUser: User | null;
  activeLocalProfile?: LocalResearcherProfile;
  onOpenAccountModal: () => void;
  onSwitchAccount: () => void;
  onSignOut: () => void;
  lastSavedTime: string | null;
  cloudSynced: boolean;
  onOpenRestartModal?: () => void;
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
  onBrightnessChange,
  currentUser,
  activeLocalProfile,
  onOpenAccountModal,
  onSwitchAccount,
  onSignOut,
  lastSavedTime,
  cloudSynced,
  onOpenRestartModal
}) => {
  const totalDiscards = wetDiscardCount + dryDiscardCount;
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close display settings popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowDisplaySettings(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const userInitial = currentUser
    ? (currentUser.displayName || currentUser.email || 'A')[0].toUpperCase()
    : 'G';

  const userDisplayName = currentUser
    ? currentUser.displayName || currentUser.email?.split('@')[0] || 'Researcher'
    : 'Guest';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Logo */}
        <button
          onClick={() => onTabChange('papers')}
          className="flex items-center gap-2.5 text-left text-slate-900 transition-colors focus-visible:outline-2 focus-visible:outline-teal-600 rounded-lg p-1 -ml-1 hover:bg-slate-100/70 shrink-0"
          aria-label="Amyloid Lab Assistant Home"
        >
          <img
            src="/assets/aistudio/Gemini_Generated_Image_dvx3bpdvx3bpdvx3_e7a8da4b.jpg"
            alt="Amyloid Lab Assistant Logo"
            className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200/90 shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
              Amyloid Lab Assistant
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
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
            Target Ledger
          </button>

          {/* AI Brainstorm Studio */}
          <button
            onClick={() => onTabChange('ai-studio')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'ai-studio'
                ? 'text-indigo-700 font-bold border-b-2 border-indigo-600'
                : 'text-indigo-600 hover:text-indigo-800 font-medium'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Brainstorm & Docs</span>
          </button>

          <button
            onClick={() => onTabChange('discards')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'discards'
                ? 'text-amber-800 font-semibold border-b-2 border-amber-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Discards & Memory</span>
            {totalDiscards > 0 && (
              <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
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
            Next Actions
          </button>
        </nav>

        {/* Zone 3: Right Controls (Account, Restart, Theme, Timer) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Restart Ideas & Start Afresh Button */}
          {onOpenRestartModal && (
            <button
              onClick={onOpenRestartModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 transition-all shrink-0 shadow-sm"
              title="Restart ideas & start afresh"
              aria-label="Restart ideas and start afresh"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600 transition-colors" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          )}

          {/* Google Account Profile & Switch Account Button */}
          <div className="relative" ref={accountRef}>
            {currentUser ? (
              /* User logged in: Profile Chip */
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-teal-600"
                aria-label="Open Account Menu"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={userDisplayName}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                )}
                <span className="hidden md:inline font-bold max-w-[90px] truncate">
                  {userDisplayName}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>
            ) : (
              /* User in 100% Free Local Mode */
              <button
                onClick={onOpenAccountModal}
                className="inline-flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-teal-600"
                title="Manage profile, switch accounts, or backup data (100% Free)"
                aria-label="Manage Account"
              >
                <div
                  className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: activeLocalProfile?.color || '#0d9488' }}
                >
                  {(activeLocalProfile?.name || 'R')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline font-bold max-w-[110px] truncate">
                  {activeLocalProfile?.name || 'Lead Researcher'}
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded hidden md:inline">
                  Free
                </span>
              </button>
            )}

            {/* Account Dropdown Menu */}
            {currentUser && showAccountDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                {/* Account Details */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={userDisplayName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-500/30"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {userInitial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">
                      {currentUser.displayName || 'Google Researcher'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                </div>

                {/* Cloud Save Status */}
                <div className="my-2 p-2 bg-emerald-50/80 rounded-lg flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-medium">
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cloud Auto-Save</span>
                  </div>
                  <span className="text-emerald-700 text-[10px] font-mono">
                    {lastSavedTime ? `Saved ${lastSavedTime}` : 'Active'}
                  </span>
                </div>

                {/* Actions */}
                <div className="space-y-1 pt-1">
                  {/* Switch Account */}
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onSwitchAccount();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 rounded-lg transition-colors font-medium text-left"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>Switch Google Account</span>
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setShowAccountDropdown(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors font-medium text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
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

        {/* Mobile quick actions: Restart + Account */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
          {onOpenRestartModal && (
            <button
              onClick={onOpenRestartModal}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-[11px] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-rose-500" />
              <span>Restart</span>
            </button>
          )}
          <button
            onClick={onOpenAccountModal}
            className="px-2 py-1 bg-slate-900 text-white rounded text-[11px] font-semibold flex items-center gap-1"
          >
            <UserIcon className="w-3 h-3" />
            <span>{currentUser ? 'Account' : 'Sign In'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
