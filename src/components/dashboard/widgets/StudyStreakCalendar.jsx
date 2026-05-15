// src/components/dashboard/widgets/StudyStreakCalendar.jsx
// GitHub-style 15-week activity heatmap.
// Derives activity purely from `history` (assessment attempts) and
// `enrollments` already fetched by ProfileDashboard — zero extra API calls.
//
// Props:
//   history     — array of assessment attempt objects (from assessmentAttemptAPI.getMyHistory)
//   enrollments — array of enrollment objects (from courseAPI.getMyEnrollments)
//   loading     — boolean

import { useMemo } from 'react';
import { Flame, CalendarDays, TrendingUp } from 'lucide-react';

const WEEKS = 15;   // columns
const DAYS  = 7;    // rows (Mon–Sun)

// Map a count → heat level 0-4
const heatLevel = (count) => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4)  return 3;
  return 4;
};

const HEAT_CLASSES = [
  'bg-gray-100',            // 0 – none
  'bg-blue-100',            // 1 – light
  'bg-blue-300',            // 2 – medium
  'bg-blue-500',            // 3 – strong
  'bg-blue-700',            // 4 – intense
];

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS   = ['M','T','W','T','F','S','S'];

// Returns "YYYY-MM-DD" for a Date object
const toKey = (d) => d.toISOString().slice(0, 10);

// Count current streak (consecutive days with activity ending today or yesterday)
const calcStreak = (activityMap) => {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Allow a 1-day grace — streak doesn't break at midnight
  const startFrom = activityMap[toKey(today)] ? today : new Date(today.getTime() - 86400000);

  let cursor = new Date(startFrom);
  while (activityMap[toKey(cursor)]) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
};

const Sk = () => (
  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
    {Array.from({ length: WEEKS * DAYS }).map((_, i) => (
      <div key={i} className="w-full aspect-square rounded-sm animate-pulse bg-gray-100" />
    ))}
  </div>
);

export const StudyStreakCalendar = ({ history = [], enrollments = [], loading = false }) => {
  // ── Build activity map ────────────────────────────────────────────────────
  const { activityMap, totalActiveDays, longestStreak } = useMemo(() => {
    const map = {};

    // Assessments taken
    history.forEach(h => {
      const d = h.submitted_at || h.createdAt;
      if (d) { const k = toKey(new Date(d)); map[k] = (map[k] || 0) + 2; }
    });

    // Course enrollments updated (proxy for lesson watched)
    enrollments.forEach(e => {
      const d = e.updatedAt || e.lastAccessedAt || e.enrolledAt || e.createdAt;
      if (d) { const k = toKey(new Date(d)); map[k] = (map[k] || 0) + 1; }
    });

    // Count active days
    const activeDays = Object.keys(map).length;

    // Longest streak
    let longest = 0, run = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      if (map[toKey(d)]) { run++; longest = Math.max(longest, run); }
      else run = 0;
    }

    return { activityMap: map, totalActiveDays: activeDays, longestStreak: longest };
  }, [history, enrollments]);

  const currentStreak = useMemo(() => calcStreak(activityMap), [activityMap]);

  // ── Build grid data ───────────────────────────────────────────────────────
  const { cells, monthMarkers } = useMemo(() => {
    const totalDays = WEEKS * DAYS;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Align end of grid to end of the current week (Sunday)
    const todayDow = (today.getDay() + 6) % 7; // Mon=0 … Sun=6
    const gridEnd  = new Date(today.getTime() + (6 - todayDow) * 86400000);
    const gridStart = new Date(gridEnd.getTime() - (totalDays - 1) * 86400000);

    const cells = [];
    const seenMonths = new Set();
    const monthMarkers = []; // { col, label }

    for (let i = 0; i < totalDays; i++) {
      const d  = new Date(gridStart.getTime() + i * 86400000);
      const k  = toKey(d);
      const col = Math.floor(i / DAYS);
      const row = i % DAYS;

      // Month label at first cell of each month in row 0
      if (row === 0) {
        const m = d.getMonth();
        if (!seenMonths.has(m)) {
          seenMonths.add(m);
          monthMarkers.push({ col, label: MONTH_LABELS[m] });
        }
      }

      cells.push({
        key: k,
        col,
        row,
        count: activityMap[k] || 0,
        isFuture: d > today,
        isToday: k === toKey(today),
        date: d,
      });
    }

    return { cells, monthMarkers };
  }, [activityMap]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Study Streak</h3>
        </div>
        {/* Streak badge */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 rounded-full px-3 py-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[12px] font-bold text-orange-600">{currentStreak} day streak</span>
          </div>
        )}
      </div>

      {loading ? (
        <Sk />
      ) : (
        <>
          {/* Month labels */}
          <div
            className="relative mb-1"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, gap: 3 }}
          >
            {monthMarkers.map(({ col, label }) => (
              <div
                key={`${col}-${label}`}
                className="text-[9px] text-gray-400 font-medium"
                style={{ gridColumnStart: col + 1 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Main heatmap grid */}
          <div className="flex gap-0.5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 mr-1.5 flex-shrink-0">
              {DAY_LABELS.map((l, i) => (
                <div key={i} className="text-[9px] text-gray-300 leading-none flex items-center"
                  style={{ height: 11 }}>
                  {i % 2 === 0 ? l : ''}
                </div>
              ))}
            </div>

            {/* Columns */}
            <div
              className="flex-1"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, 1fr)`, gap: 3 }}
            >
              {Array.from({ length: WEEKS }).map((_, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-0.5">
                  {cells
                    .filter(c => c.col === colIdx)
                    .map(cell => {
                      const level = cell.isFuture ? -1 : heatLevel(cell.count);
                      return (
                        <div
                          key={cell.key}
                          title={`${cell.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                          className={`
                            aspect-square rounded-sm transition-all duration-150 cursor-default
                            ${cell.isFuture
                              ? 'bg-gray-50 opacity-40'
                              : cell.isToday
                                ? 'ring-2 ring-offset-1 ring-blue-400 ' + HEAT_CLASSES[level]
                                : HEAT_CLASSES[level]
                            }
                          `}
                        />
                      );
                    })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer stats */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-gray-400">Active days</p>
                <p className="text-[14px] font-bold text-gray-800">{totalActiveDays}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Longest streak</p>
                <p className="text-[14px] font-bold text-gray-800">{longestStreak}d</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">Tests taken</p>
                <p className="text-[14px] font-bold text-gray-800">{history.length}</p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-gray-300 mr-1">Less</span>
              {HEAT_CLASSES.map((cls, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
              ))}
              <span className="text-[9px] text-gray-300 ml-1">More</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudyStreakCalendar;