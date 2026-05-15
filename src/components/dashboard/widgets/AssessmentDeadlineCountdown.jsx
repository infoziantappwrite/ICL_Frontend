// src/components/dashboard/widgets/AssessmentDeadlineCountdown.jsx
// Countdown rings for pending assessments with a due_date / end_date field.
// Props:
//   assessments — from assessmentAttemptAPI.getMyAssignedAssessments (already fetched)
//   onStart     — (assessmentId) => void
//   loading     — boolean

import { useState, useEffect, useMemo } from 'react';
import { Timer, PlayCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ── Time helpers ────────────────────────────────────────────────────────────
const msLeft = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 ? diff : 0;
};

const fmtCountdown = (ms) => {
  if (ms === null) return null;
  const totalSecs = Math.floor(ms / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (d > 0) return { str: `${d}d ${h}h`, short: `${d}d`, level: d <= 1 ? 'warn' : 'ok' };
  if (h > 0) return { str: `${h}h ${m}m`, short: `${h}h`, level: h < 6 ? 'danger' : 'warn' };
  return { str: `${m}m ${s}s`, short: `${m}m`, level: 'danger' };
};

// Total window: treat 7 days as 100% — ring depletes as deadline approaches
const ringPct = (ms, totalMs) => {
  if (ms === null || ms === 0) return 0;
  return Math.min(100, (ms / totalMs) * 100);
};

const RING_COLORS = {
  ok:     { stroke: '#3b82f6', bg: '#dbeafe', text: 'text-blue-600',   badge: 'bg-blue-50 text-blue-700 border-blue-100' },
  warn:   { stroke: '#f59e0b', bg: '#fef3c7', text: 'text-amber-600',  badge: 'bg-amber-50 text-amber-700 border-amber-100' },
  danger: { stroke: '#ef4444', bg: '#fee2e2', text: 'text-red-600',    badge: 'bg-red-50 text-red-700 border-red-100' },
};

// ── Single countdown ring card ───────────────────────────────────────────────
const RingCard = ({ assessment, onStart }) => {
  const dueField = assessment.due_date || assessment.end_date || assessment.dueDate
    || assessment.deadline || assessment.endDate || null;

  const totalMs   = 7 * 24 * 3600 * 1000; // 7-day reference window
  const [ms, setMs] = useState(() => msLeft(dueField));

  useEffect(() => {
    if (!dueField || ms === 0) return;
    const id = setInterval(() => setMs(msLeft(dueField)), 1000);
    return () => clearInterval(id);
  }, [dueField]);

  const fmt       = useMemo(() => fmtCountdown(ms), [ms]);
  const pct       = ringPct(ms, totalMs);
  const level     = fmt?.level || 'ok';
  const colors    = RING_COLORS[level];
  const R         = 28;
  const circ      = 2 * Math.PI * R;
  const offset    = circ - (circ * pct) / 100;
  const title     = assessment.title || assessment.jd_id?.jobTitle || 'Assessment';

  return (
    <div
      onClick={onStart}
      className="group flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-3.5 cursor-pointer hover:border-blue-200 hover:shadow-[0_4px_16px_rgba(59,130,246,0.08)] transition-all duration-200"
    >
      {/* Ring */}
      <div className="relative w-[64px] h-[64px] flex-shrink-0">
        <svg viewBox="0 0 64 64" className="-rotate-90 w-16 h-16">
          <circle cx="32" cy="32" r={R} stroke={colors.bg} strokeWidth="5" fill="none" />
          <circle
            cx="32" cy="32" r={R}
            stroke={colors.stroke}
            strokeWidth="5" fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s linear' }}
          />
        </svg>
        {/* Icon in centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          {ms === 0
            ? <CheckCircle2 className="w-4 h-4 text-gray-300" />
            : level === 'danger'
              ? <AlertTriangle className={`w-4 h-4 ${colors.text}`} />
              : <Timer className={`w-4 h-4 ${colors.text}`} />}
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-[13px] text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {title}
        </h4>

        {dueField ? (
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
              {ms === 0 ? 'Expired' : fmt?.str || '—'}
            </span>
            {ms === 0 && (
              <span className="text-[10px] text-gray-400">Time up</span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 mt-1 block">No deadline set</span>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onStart?.(); }}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 group/b"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          {assessment.score !== null && assessment.score !== undefined ? 'Retake' : 'Start now'}
        </button>
      </div>

      {/* Urgency indicator bar (right edge) */}
      {dueField && ms > 0 && (
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          level === 'ok' ? 'bg-blue-200' : level === 'warn' ? 'bg-amber-300' : 'bg-red-400'}`} />
      )}
    </div>
  );
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = () => (
  <div className="flex gap-3 bg-white border border-gray-100 rounded-2xl p-3.5 animate-pulse">
    <div className="w-16 h-16 rounded-full bg-gray-100 flex-shrink-0" />
    <div className="flex-1 space-y-2 py-1">
      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
      <div className="h-2.5 bg-gray-100 rounded w-1/3" />
    </div>
  </div>
);

// ── Main export ───────────────────────────────────────────────────────────────
export const AssessmentDeadlineCountdown = ({ assessments = [], onStart, loading = false }) => {
  // Filter to only assessments that have a due date
  const withDeadline = useMemo(() =>
    assessments
      .filter(a => a.due_date || a.end_date || a.dueDate || a.deadline || a.endDate)
      .sort((a, b) => {
        const da = new Date(a.due_date || a.end_date || a.dueDate || a.deadline || a.endDate);
        const db = new Date(b.due_date || b.end_date || b.dueDate || b.deadline || b.endDate);
        return da - db; // soonest first
      }),
    [assessments]
  );

  // Assessments without deadlines but still show them at bottom as plain cards
  const withoutDeadline = useMemo(() =>
    assessments.filter(a => !(a.due_date || a.end_date || a.dueDate || a.deadline || a.endDate)),
    [assessments]
  );

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
        <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-2.5">{[0,1].map(i => <Sk key={i} />)}</div>
      </div>
    );
  }

  // If no assessments at all, render nothing (dashboard handles empty state)
  if (assessments.length === 0) return null;

  // If none have deadlines, show a slim prompt instead of hiding the widget
  if (withDeadline.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Assessment Deadlines</h3>
        </div>
        <p className="text-[12px] text-gray-400 leading-relaxed">
          None of your current assessments have a deadline set. Tap any assessment below to start.
        </p>
      </div>
    );
  }

  const urgentCount = withDeadline.filter(a => {
    const ms = msLeft(a.due_date || a.end_date || a.dueDate || a.deadline || a.endDate);
    return ms !== null && ms < 86400000; // < 24h
  }).length;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Assessment Deadlines</h3>
        </div>
        {urgentCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-100">
            <AlertTriangle className="w-3 h-3" />
            {urgentCount} urgent
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {withDeadline.map(a => (
          <RingCard
            key={a._id || a.id}
            assessment={a}
            onStart={() => onStart?.(a._id || a.id)}
          />
        ))}
      </div>

      {/* Assessments without deadlines — compact list */}
      {withoutDeadline.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">No deadline</p>
          <div className="space-y-1.5">
            {withoutDeadline.slice(0, 3).map(a => (
              <button
                key={a._id || a.id}
                onClick={() => onStart?.(a._id || a.id)}
                className="w-full flex items-center gap-2.5 py-1.5 text-left group"
              >
                <div className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
                <span className="text-[12px] text-gray-600 group-hover:text-blue-600 transition-colors truncate">
                  {a.title || a.jd_id?.jobTitle || 'Assessment'}
                </span>
                <PlayCircle className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 ml-auto flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDeadlineCountdown;