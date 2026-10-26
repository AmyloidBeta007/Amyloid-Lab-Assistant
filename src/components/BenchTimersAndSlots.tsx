import React, { useState, useEffect } from 'react';
import { LabTimer, StopwatchLap, LabSlotBooking } from '../types';
import { formatTimeSeconds } from '../utils/bioMath';
import { labAudio } from '../utils/audioAlert';
import {
  Timer, Clock, Play, Pause, RotateCcw, Plus, Trash2,
  Calendar, Bell, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';

interface BenchTimersAndSlotsProps {
  timers: LabTimer[];
  slots: LabSlotBooking[];
  onAddTimer: (timer: LabTimer) => void;
  onUpdateTimer: (timer: LabTimer) => void;
  onDeleteTimer: (id: string) => void;
  onAddSlot: (slot: LabSlotBooking) => void;
  onDeleteSlot: (id: string) => void;
  onUpdateSlot: (slot: LabSlotBooking) => void;
}

export const BenchTimersAndSlots: React.FC<BenchTimersAndSlotsProps> = ({
  timers,
  slots,
  onAddTimer,
  onUpdateTimer,
  onDeleteTimer,
  onAddSlot,
  onDeleteSlot,
  onUpdateSlot
}) => {
  // Live lab clock
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Timer Tick Engine
  useEffect(() => {
    const timerInterval = setInterval(() => {
      timers.forEach(t => {
        if (t.isRunning && !t.isPaused && t.remainingSeconds > 0) {
          const next = t.remainingSeconds - 1;
          if (next === 0) {
            labAudio.playTimerCompleteChime();
            onUpdateTimer({
              ...t,
              remainingSeconds: 0,
              isRunning: false,
              isPaused: false,
              completedAt: Date.now()
            });
          } else {
            onUpdateTimer({
              ...t,
              remainingSeconds: next
            });
          }
        }
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [timers, onUpdateTimer]);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchLaps, setStopwatchLaps] = useState<StopwatchLap[]>([]);

  useEffect(() => {
    let swInterval: NodeJS.Timeout;
    if (stopwatchRunning) {
      swInterval = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(swInterval);
  }, [stopwatchRunning]);

  const handleStopwatchLap = () => {
    const lastLapTime = stopwatchLaps.length > 0 ? stopwatchLaps[stopwatchLaps.length - 1].timeSeconds : 0;
    const split = stopwatchTime - lastLapTime;
    const newLap: StopwatchLap = {
      lapNumber: stopwatchLaps.length + 1,
      timeSeconds: stopwatchTime,
      splitSeconds: split
    };
    setStopwatchLaps([...stopwatchLaps, newLap]);
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setStopwatchLaps([]);
  };

  // Add Timer Form State
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState(15);
  const [newTimerType, setNewTimerType] = useState<LabTimer['type']>('incubation');

  const handleCreateTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimerName.trim() || newTimerMinutes <= 0) return;
    const duration = newTimerMinutes * 60;
    const newT: LabTimer = {
      id: `timer-${Date.now()}`,
      name: newTimerName.trim(),
      durationSeconds: duration,
      remainingSeconds: duration,
      isRunning: true,
      isPaused: false,
      type: newTimerType
    };
    onAddTimer(newT);
    setNewTimerName('');
  };

  const handleQuickAdd = (name: string, minutes: number, type: LabTimer['type']) => {
    const duration = minutes * 60;
    onAddTimer({
      id: `timer-${Date.now()}`,
      name,
      durationSeconds: duration,
      remainingSeconds: duration,
      isRunning: true,
      isPaused: false,
      type
    });
  };

  // Slot modal state
  const [showSlotModal, setShowSlotModal] = useState(false);

  // Check upcoming slots in next 24 hours
  const todayStr = currentDate.toISOString().split('T')[0];
  const upcomingTodaySlots = slots.filter(s => s.date === todayStr && s.status === 'Upcoming');

  return (
    <div className="space-y-6">
      {/* Top Banner with Microscopic Equipment visual */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white p-6 sm:p-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/src/assets/images/microscope_confocal_lens_1792938143735.jpg"
            alt="Laboratory Precision Instrument"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-300 mb-2">
            <span>LAB BENCH ENGINE</span>
            <span aria-hidden="true">·</span>
            <span>MULTI-TIMERS & INSTRUMENT RESERVATIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Concurrent Bench Timers, Precision Stopwatch & Equipment Slots
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Run incubation, centrifugation, and hybridization timers in parallel. Keep track of core facility instrument bookings and reminders.
          </p>
        </div>
      </div>

      {/* Live Lab Clock & Instrument Status Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 rounded-lg border border-teal-200 text-teal-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Laboratory Standard Local Time
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900">
              {currentDate.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500">
              {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Slot alert notification */}
        {upcomingTodaySlots.length > 0 ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg text-xs text-amber-900">
            <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <div>
              <strong className="font-semibold">Upcoming Lab Booking Today:</strong>{' '}
              <span>{upcomingTodaySlots[0].equipmentName} at {upcomingTodaySlots[0].startTime} ({upcomingTodaySlots[0].sampleCount} samples)</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>No conflicting equipment slots scheduled for today</span>
          </div>
        )}
      </div>

      {/* Concurrent Multi-Timers Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">
                Concurrent Bench Multi-Timers ({timers.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Run multiple laboratory reactions side-by-side with audible alarms and visual alerts.
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => handleQuickAdd('15m Centrifuge Spin', 15, 'centrifuge')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors"
            >
              + 15m Spin
            </button>
            <button
              onClick={() => handleQuickAdd('30m Enzymatic Digestion', 30, 'digestion')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors"
            >
              + 30m Digest
            </button>
            <button
              onClick={() => handleQuickAdd('45m 37°C Incubation', 45, 'incubation')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors"
            >
              + 45m Incubate
            </button>
          </div>
        </div>

        {/* Timers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timers.length === 0 ? (
            <div className="col-span-full text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
              No active timers. Use the form below or quick presets to start an incubation or centrifuge countdown.
            </div>
          ) : (
            timers.map(timer => {
              const isDone = timer.remainingSeconds === 0;
              const percent = timer.durationSeconds > 0
                ? Math.round(((timer.durationSeconds - timer.remainingSeconds) / timer.durationSeconds) * 100)
                : 100;

              return (
                <div
                  key={timer.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isDone
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400'
                      : timer.isRunning && !timer.isPaused
                      ? 'bg-white border-teal-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-semibold block">
                        {timer.type}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {timer.name}
                      </h3>
                      {timer.protocolStepTitle && (
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                          {timer.protocolStepTitle}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => onDeleteTimer(timer.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      aria-label="Delete timer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Monospace Countdown */}
                  <div className="flex items-baseline justify-between">
                    <span className={`text-3xl font-mono font-bold tabular-nums tracking-tight ${
                      isDone ? 'text-rose-700 animate-pulse' : 'text-slate-900'
                    }`}>
                      {formatTimeSeconds(timer.remainingSeconds)}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      / {formatTimeSeconds(timer.durationSeconds)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isDone ? 'bg-rose-600' : 'bg-teal-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    {isDone ? (
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-rose-600" />
                        <span>Timer Completed!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            onUpdateTimer({
                              ...timer,
                              isRunning: !timer.isRunning || timer.isPaused,
                              isPaused: !timer.isPaused && timer.isRunning
                            });
                          }}
                          className={`px-3 py-1 rounded font-semibold flex items-center gap-1 transition-colors ${
                            timer.isRunning && !timer.isPaused
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          {timer.isRunning && !timer.isPaused ? (
                            <>
                              <Pause className="w-3 h-3 fill-amber-800" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-white" />
                              <span>Start</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            onUpdateTimer({
                              ...timer,
                              remainingSeconds: timer.durationSeconds,
                              isRunning: false,
                              isPaused: false
                            });
                          }}
                          className="p-1 text-slate-500 hover:text-slate-800"
                          title="Reset timer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        onUpdateTimer({
                          ...timer,
                          remainingSeconds: timer.remainingSeconds + 300,
                          durationSeconds: timer.durationSeconds + 300
                        });
                      }}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold"
                    >
                      +5m
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Custom Timer Launch Form */}
        <form onSubmit={handleCreateTimer} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-end text-xs">
          <div className="flex-1 w-full space-y-1">
            <label className="block font-semibold text-slate-700">Timer Label / Reaction</label>
            <input
              type="text"
              required
              value={newTimerName}
              onChange={e => setNewTimerName(e.target.value)}
              placeholder="e.g. Hybridization Oven 58°C, Proteinase K Digestion..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="w-full sm:w-32 space-y-1">
            <label className="block font-semibold text-slate-700">Duration (mins)</label>
            <input
              type="number"
              min={1}
              value={newTimerMinutes}
              onChange={e => setNewTimerMinutes(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="w-full sm:w-36 space-y-1">
            <label className="block font-semibold text-slate-700">Type</label>
            <select
              value={newTimerType}
              onChange={e => setNewTimerType(e.target.value as LabTimer['type'])}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
            >
              <option value="incubation">Incubation</option>
              <option value="centrifuge">Centrifuge</option>
              <option value="hybridization">Hybridization</option>
              <option value="pcr">PCR Run</option>
              <option value="digestion">Digestion</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            Start Timer
          </button>
        </form>
      </div>

      {/* Split Section: High-Precision Stopwatch (Left 5 cols) & Lab Slot Scheduler (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Stopwatch Suite */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Bench Precision Stopwatch & Splits
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Laps: {stopwatchLaps.length}
            </span>
          </div>

          {/* Stopwatch Big Display */}
          <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-4xl font-mono font-bold text-slate-900 tabular-nums">
              {formatTimeSeconds(stopwatchTime)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setStopwatchRunning(!stopwatchRunning)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                stopwatchRunning
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              {stopwatchRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-amber-800" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              onClick={handleStopwatchLap}
              disabled={!stopwatchRunning}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
            >
              Record Lap
            </button>

            <button
              onClick={handleStopwatchReset}
              className="p-2 text-slate-400 hover:text-slate-800 rounded-lg"
              title="Reset stopwatch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Laps List */}
          {stopwatchLaps.length > 0 && (
            <div className="mt-3 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200 font-mono">
                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="p-2">Lap #</th>
                    <th className="p-2">Split</th>
                    <th className="p-2 text-right">Elapsed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stopwatchLaps.slice().reverse().map(lap => (
                    <tr key={lap.lapNumber} className="hover:bg-slate-50">
                      <td className="p-2 font-sans font-medium text-slate-700">Lap {lap.lapNumber}</td>
                      <td className="p-2 text-teal-700">+{formatTimeSeconds(lap.splitSeconds)}</td>
                      <td className="p-2 text-right text-slate-900 font-bold">{formatTimeSeconds(lap.timeSeconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lab Slot Scheduler */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Core Lab Instrument Slots & Reminders
              </h3>
            </div>
            <button
              onClick={() => setShowSlotModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Slot</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {slots.map(slot => (
              <div
                key={slot.id}
                className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{slot.equipmentName}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      slot.status === 'Completed'
                        ? 'bg-slate-100 text-slate-600'
                        : slot.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {slot.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                    <span>{slot.date}</span>
                    <span aria-hidden="true">·</span>
                    <span>{slot.startTime} - {slot.endTime}</span>
                    <span aria-hidden="true">·</span>
                    <span>{slot.sampleCount} samples</span>
                  </div>

                  <p className="text-slate-700 text-xs">{slot.projectGoal}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onUpdateSlot({
                      ...slot,
                      status: slot.status === 'Completed' ? 'Upcoming' : 'Completed'
                    })}
                    className="px-2.5 py-1 text-[11px] font-medium border border-slate-200 rounded hover:bg-slate-50"
                  >
                    {slot.status === 'Completed' ? 'Re-open' : 'Mark Done'}
                  </button>
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    aria-label="Delete slot booking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book Slot Modal */}
      {showSlotModal && (
        <BookSlotModal
          onClose={() => setShowSlotModal(false)}
          onAdd={newSlot => {
            onAddSlot(newSlot);
            setShowSlotModal(false);
          }}
        />
      )}
    </div>
  );
};

interface BookSlotModalProps {
  onClose: () => void;
  onAdd: (slot: LabSlotBooking) => void;
}

const BookSlotModal: React.FC<BookSlotModalProps> = ({ onClose, onAdd }) => {
  const [equipmentName, setEquipmentName] = useState('Leica SP8 Confocal Laser Scanning Microscope');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('11:00');
  const [endTime, setEndTime] = useState('12:30');
  const [sampleCount, setSampleCount] = useState(8);
  const [projectGoal, setProjectGoal] = useState('');
  const [bookedBy, setBookedBy] = useState('Sumaiya (Me)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectGoal.trim()) return;

    const newSlot: LabSlotBooking = {
      id: `slot-${Date.now()}`,
      equipmentName,
      date,
      startTime,
      endTime,
      bookedBy: bookedBy.trim() || 'Sumaiya (Me)',
      projectGoal: projectGoal.trim(),
      sampleCount: Number(sampleCount) || 1,
      reminderMinutesBefore: 30,
      status: 'Upcoming'
    };

    onAdd(newSlot);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Book Core Lab Instrument Slot
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Equipment Name *</label>
            <select
              value={equipmentName}
              onChange={e => setEquipmentName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="Leica SP8 Confocal Laser Scanning Microscope">Leica SP8 Confocal Laser Scanning Microscope</option>
              <option value="Agilent 2100 Bioanalyzer (RNA Nano Chip)">Agilent 2100 Bioanalyzer (RNA Nano Chip)</option>
              <option value="Illumina NextSeq 2000 Sequencer">Illumina NextSeq 2000 Sequencer</option>
              <option value="QuantStudio 7 Pro Real-Time PCR (qPCR)">QuantStudio 7 Pro Real-Time PCR (qPCR)</option>
              <option value="Beckman Coulter Optima L-90K Ultracentrifuge">Beckman Coulter Optima L-90K Ultracentrifuge</option>
              <option value="HPC GPU Cluster Node (48GB V100 / A100)">HPC GPU Cluster Node (48GB V100 / A100)</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sample Count</label>
              <input
                type="number"
                min={1}
                value={sampleCount}
                onChange={e => setSampleCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Booked By</label>
              <input
                type="text"
                value={bookedBy}
                onChange={e => setBookedBy(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Goal & Fluorophores / Conditions *</label>
            <textarea
              required
              value={projectGoal}
              onChange={e => setProjectGoal(e.target.value)}
              rows={2}
              placeholder="e.g. DAPI & GFP imaging of Cas9 transfected neurospheres, 8 coverslips..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-medium">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
              Confirm Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
