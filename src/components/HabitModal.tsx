import React, { useState, useEffect } from 'react';
import { Habit, HabitCategory } from '../types';
import { HabitIcon, AVAILABLE_ICONS } from './HabitIcon';
import { CATEGORY_META } from '../utils/statsCalculator';
import { X, Check, Bell, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDateKey } from '../utils/dateUtils';
import { requestNotificationPermission } from '../utils/notificationService';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => void;
  editingHabit?: Habit | null;
}

const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#0284c7', // Sky
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#ea580c', // Orange
  '#e11d48', // Rose
];

const TIME_PRESETS = [
  { label: 'Morning', time: '07:00' },
  { label: 'Midday', time: '12:30' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '21:00' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [icon, setIcon] = useState('Droplets');
  const [color, setColor] = useState('#2563eb');
  const [targetDaysPerWeek, setTargetDaysPerWeek] = useState(7);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category);
      setIcon(editingHabit.icon);
      setColor(editingHabit.color);
      setTargetDaysPerWeek(editingHabit.targetDaysPerWeek || 7);
      setReminderEnabled(Boolean(editingHabit.reminderEnabled));
      setReminderTime(editingHabit.reminderTime || '08:00');
      setError('');
    } else {
      setTitle('');
      setDescription('');
      setCategory('health');
      setIcon('Droplets');
      setColor('#2563eb');
      setTargetDaysPerWeek(7);
      setReminderEnabled(false);
      setReminderTime('08:00');
      setError('');
    }
  }, [editingHabit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a habit title.');
      return;
    }

    onSave({
      ...(editingHabit ? { id: editingHabit.id } : { id: `habit-${Date.now()}` }),
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      color,
      targetDaysPerWeek,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      createdAt: editingHabit ? editingHabit.createdAt : formatDateKey(new Date()),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/40 backdrop-blur-xs">
        <motion.div
          id="habit-modal-dialog"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 shrink-0">
            <h2 className="text-base font-bold text-stone-900">
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </h2>
            <button
              id="close-habit-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
            {error && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="habit-title-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Habit Title *
              </label>
              <input
                id="habit-title-input"
                type="text"
                placeholder="e.g. Morning 10-minute Meditation"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:bg-white text-stone-900"
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="habit-desc-input" className="block text-xs font-semibold text-stone-700 mb-1">
                Description (Optional)
              </label>
              <input
                id="habit-desc-input"
                type="text"
                placeholder="e.g. Calm breathing before turning on computer"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:bg-white text-stone-900"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CATEGORY_META) as HabitCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      id={`modal-cat-${cat}`}
                      onClick={() => setCategory(cat)}
                      className={`text-xs font-medium py-2 px-2.5 rounded-lg border text-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white font-semibold shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50'
                      }`}
                    >
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color & Icon Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      id={`color-btn-${c.replace('#', '')}`}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        color === c ? 'ring-2 ring-stone-900 ring-offset-2 scale-105' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency Target */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Target Frequency: <span className="font-bold text-stone-900">{targetDaysPerWeek} days/week</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      id={`target-freq-${num}`}
                      onClick={() => setTargetDaysPerWeek(num)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded border transition-colors ${
                        targetDaysPerWeek === num
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Icon</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                {AVAILABLE_ICONS.map((iconName) => {
                  const isSelected = icon === iconName;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      id={`modal-icon-${iconName}`}
                      onClick={() => setIcon(iconName)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <HabitIcon name={iconName} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Reminder Time & Notification */}
            <div className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label htmlFor="habit-reminder-toggle" className="text-xs font-bold text-stone-800 cursor-pointer">
                      Daily Reminder Notification
                    </label>
                    <p className="text-[11px] text-stone-500">
                      Alert and sound chime at your set habit time
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="habit-reminder-toggle"
                    checked={reminderEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setReminderEnabled(enabled);
                      if (enabled) {
                        requestNotificationPermission().catch(() => {});
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {reminderEnabled && (
                <div className="space-y-2.5 pt-1 border-t border-stone-200/60">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="habit-reminder-time-input"
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-bold font-mono bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-stone-800"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase mr-1">Presets:</span>
                    {TIME_PRESETS.map((p) => (
                      <button
                        key={p.time}
                        type="button"
                        onClick={() => setReminderTime(p.time)}
                        className={`text-[11px] font-medium px-2 py-1 rounded-md border transition-colors ${
                          reminderTime === p.time
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {p.label} ({p.time})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 p-3.5 sm:px-6 sm:py-4 border-t border-stone-100 bg-stone-50/50 shrink-0 pb-safe">
              <button
                type="button"
                id="cancel-modal-btn"
                onClick={onClose}
                className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="submit-habit-btn"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 transition-colors active:scale-95"
              >
                {editingHabit ? 'Save Changes' : 'Create Habit'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
