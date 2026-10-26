import React, { useState } from 'react';
import { MoodLogEntry } from '../types';
import { computeMoodStats } from '../utils/bioMath';
import { Smile, Zap, Activity, Plus, Trash2, BatteryCharging, Sparkles } from 'lucide-react';

interface MoodEnergyTrackerProps {
  entries: MoodLogEntry[];
  onAddEntry: (entry: MoodLogEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const MoodEnergyTracker: React.FC<MoodEnergyTrackerProps> = ({
  entries,
  onAddEntry,
  onDeleteEntry
}) => {
  const stats = computeMoodStats(entries);

  // Daily log state
  const [moodScore, setMoodScore] = useState<number>(4);
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [reflection, setReflection] = useState('');
  const [labTrigger, setLabTrigger] = useState<MoodLogEntry['labTrigger']>('Clean Gel Band');

  const moodLabels: Record<number, string> = {
    1: 'Contamination Crisis / Burnout',
    2: 'Troubleshooting / Frustrated',
    3: 'Routine Bench / Neutral',
    4: 'Steady Progress / Clean Data',
    5: 'Eureka / Breakthrough Moment!'
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) return;

    const newEntry: MoodLogEntry = {
      id: `mood-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      moodScore,
      moodLabel: moodLabels[moodScore],
      energyLevel,
      reflection: reflection.trim(),
      labTrigger
    };

    onAddEntry(newEntry);
    setReflection('');
  };

  // SVG Chart Geometry
  // Plot up to 10 recent entries sorted chronologically
  const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp).slice(-10);
  const chartWidth = 560;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 30;

  const pointsMood = sortedEntries.map((e, idx) => {
    const x = paddingX + (idx / Math.max(1, sortedEntries.length - 1)) * (chartWidth - paddingX * 2);
    // score 1..5 maps to height
    const y = chartHeight - paddingY - ((e.moodScore - 1) / 4) * (chartHeight - paddingY * 2);
    return { x, y, entry: e };
  });

  const pointsEnergy = sortedEntries.map((e, idx) => {
    const x = paddingX + (idx / Math.max(1, sortedEntries.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((e.energyLevel - 1) / 4) * (chartHeight - paddingY * 2);
    return { x, y, entry: e };
  });

  const pathMood = pointsMood.length > 1
    ? pointsMood.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  const pathEnergy = pointsEnergy.length > 1
    ? pointsEnergy.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')
    : '';

  return (
    <div className="space-y-6">
      {/* Overview Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Average Lab Mood</span>
            <Smile className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
            {stats.averageMood} <span className="text-xs text-slate-400 font-sans">/ 5.0</span>
          </div>
          <p className="text-[11px] text-teal-700 font-medium">Over {stats.totalLogs} recorded sessions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Average Energy Level</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
            {stats.averageEnergy} <span className="text-xs text-slate-400 font-sans">/ 5.0</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">Mental stamina & focus</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Consecutive Log Streak</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
            {stats.streakDays} <span className="text-xs text-slate-400 font-sans">days</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">Consistent reflection streak</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Top Mood Catalyst</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {stats.dominantTrigger}
          </div>
          <p className="text-[11px] text-slate-500">Most frequent emotional catalyst</p>
        </div>
      </div>

      {/* SVG Mood & Energy Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Lab Mood & Mental Energy Longitudinal Curve
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical correlation of emotional endurance against lab roadblocks and breakthroughs.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-teal-700">
              <span className="w-3 h-0.5 bg-teal-600 inline-block rounded" />
              <span>Mood (1-5)</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-3 h-0.5 bg-amber-500 inline-block rounded stroke-dashed" />
              <span>Energy (1-5)</span>
            </span>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="overflow-x-auto bg-slate-50/60 rounded-xl border border-slate-200 p-2 flex justify-center">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full max-w-[560px] h-auto select-none font-mono"
            style={{ minWidth: '420px' }}
          >
            {/* Horizontal Grid lines */}
            {[1, 2, 3, 4, 5].map(lvl => {
              const y = chartHeight - paddingY - ((lvl - 1) / 4) * (chartHeight - paddingY * 2);
              return (
                <g key={lvl}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="9px"
                  >
                    {lvl}
                  </text>
                </g>
              );
            })}

            {/* Paths */}
            {pathMood && (
              <path
                d={pathMood}
                fill="none"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
            {pathEnergy && (
              <path
                d={pathEnergy}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            )}

            {/* Mood Nodes */}
            {pointsMood.map((p, idx) => (
              <g key={`mood-node-${idx}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                />
                <text
                  x={p.x}
                  y={chartHeight - 10}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8.5px"
                  fontFamily="sans-serif"
                >
                  {p.entry.date.slice(5)}
                </text>
              </g>
            ))}

            {/* Energy Nodes */}
            {pointsEnergy.map((p, idx) => (
              <circle
                key={`energy-node-${idx}`}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#f59e0b"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Split: Check-in Form (Left 5 cols) & History Log (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Check-in Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-teal-600" />
              <span>Today's Lab Mindset Check-In</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acknowledge your lab frustrations and wins openly.
            </p>
          </div>

          <form onSubmit={handleSaveLog} className="space-y-4 text-xs">
            {/* Mood Scale Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">Lab Mood (1 = Devastated, 5 = Eureka)</label>
                <span className="font-bold text-teal-700 font-mono text-sm">{moodScore}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={moodScore}
                onChange={e => setMoodScore(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="text-[11px] text-teal-800 font-medium mt-1">
                {moodLabels[moodScore]}
              </div>
            </div>

            {/* Energy Level Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700">Mental Energy / Stamina</label>
                <span className="font-bold text-amber-600 font-mono text-sm">{energyLevel}/5</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={energyLevel}
                onChange={e => setEnergyLevel(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                {energyLevel >= 4 ? 'High Focus — Ideal for reading papers or troubleshooting pipelines' : 'Low Stamina — Ideal for routine tip racking, autoclaving, or rest'}
              </div>
            </div>

            {/* Primary Lab Trigger */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Key Lab Event Today</label>
              <select
                value={labTrigger}
                onChange={e => setLabTrigger(e.target.value as MoodLogEntry['labTrigger'])}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Clean Gel Band">Clean Gel Band at expected size</option>
                <option value="PCR Succeeded">PCR Succeeded</option>
                <option value="Contamination Crisis">Contamination Crisis / Ruined Buffer</option>
                <option value="Sequencing Done">Sequencing Run Finished</option>
                <option value="Code/Pipeline Bug">Bioinformatics Bug / Memory Crash</option>
                <option value="Hypothesis Validated">Hypothesis Validated in Replicates</option>
                <option value="Late Lab Night">Late Lab Night & Pipetting Fatigue</option>
                <option value="Paper Accepted">Paper / Abstract Accepted</option>
              </select>
            </div>

            {/* Reflection Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Honest Lab Reflection *</label>
              <textarea
                required
                value={reflection}
                onChange={e => setReflection(e.target.value)}
                rows={3}
                placeholder="What happened at the bench today? What gave you energy or caused a headache?"
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Log Today's Entry
            </button>
          </form>
        </div>

        {/* Reflection History Log */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Lab Journal & Reflections ({entries.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Chronological archive</span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {entries.slice().reverse().map(entry => (
              <div
                key={entry.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-medium">{entry.date}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {entry.labTrigger}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-800">
                      Mood {entry.moodScore}/5
                    </span>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="text-slate-300 hover:text-rose-600 p-0.5"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-800 leading-relaxed">
                  {entry.reflection}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
