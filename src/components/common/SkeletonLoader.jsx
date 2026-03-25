// src/components/common/SkeletonLoader.jsx
// Unified skeleton loader system — replaces LoadingSpinner entirely

/* ─── Base shimmer element ────────────────────────────────────────────── */
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

/* ─── Generic full-page skeleton ─────────────────────────────────────── */
// Used for pages that had <LoadingSpinner fullScreen /> with the gradient bg
export const PageSkeleton = ({ rows = 6 }) => (
  <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex flex-col">
    {/* Hero banner placeholder */}
    <div className="animate-pulse m-4 sm:m-6 h-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />

    {/* Stat pills row */}
    <div className="animate-pulse mx-4 sm:mx-6 mb-4 bg-white/80 rounded-2xl border border-white/60 p-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>

    {/* Main content area */}
    <div className="mx-4 sm:mx-6 grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-4/6" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── Dashboard skeleton ──────────────────────────────────────────────── */
export const DashboardSkeleton = ({ layout: Layout }) => {
  const content = (
    <div className="space-y-4">
      {/* Hero banner */}
      <div className="animate-pulse h-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />

      {/* Pills */}
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 overflow-hidden">
              <div className="h-10 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100" />
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                    </div>
                    <div className="w-16 h-5 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/6" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {content}
    </div>
  );
};

/* ─── Table / management page skeleton ────────────────────────────────── */
export const TableSkeleton = ({ layout: Layout, rows = 8 }) => {
  const content = (
    <div className="space-y-4">
      {/* Hero */}
      <div className="animate-pulse h-20 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />

      {/* Stats row */}
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-3">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="w-24 h-10 bg-gray-200 rounded-xl" />
          <div className="w-24 h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 overflow-hidden">
        {/* thead */}
        <div className="flex gap-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
          {[2, 1, 1, 1, 1, 0.8].map((w, i) => (
            <div key={i} className={`h-3 bg-gray-300 rounded flex-${w === 2 ? '[2]' : '[1]'}`}
              style={{ flex: w }} />
          ))}
        </div>
        {/* rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-2 flex-[2]">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="flex-1"><div className="h-5 bg-gray-100 rounded-lg w-20" /></div>
            <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-24" /></div>
            <div className="flex-1"><div className="h-3 bg-gray-100 rounded w-16" /></div>
            <div className="flex-1"><div className="h-5 bg-gray-100 rounded-full w-16" /></div>
            <div className="flex-[0.8]">
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-gray-100 rounded-md" />
                <div className="w-6 h-6 bg-gray-100 rounded-md" />
                <div className="w-6 h-6 bg-gray-100 rounded-md" />
              </div>
            </div>
          </div>
        ))}
        {/* pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-t border-gray-100">
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-7 h-7 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {content}
    </div>
  );
};

/* ─── Detail / form page skeleton ─────────────────────────────────────── */
export const DetailSkeleton = ({ layout: Layout }) => {
  const content = (
    <div className="space-y-4">
      {/* Hero */}
      <div className="animate-pulse h-20 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-5 space-y-4">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-10 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-4 space-y-3">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {content}
    </div>
  );
};

/* ─── Analytics skeleton ──────────────────────────────────────────────── */
export const AnalyticsSkeleton = ({ layout: Layout }) => {
  const content = (
    <div className="space-y-4">
      {/* Hero */}
      <div className="animate-pulse h-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />

      {/* Pills */}
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Tile rows */}
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-20 bg-gray-100 rounded-xl" />
                ))}
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-5 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/6" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {content}
    </div>
  );
};

/* ─── Inline / panel skeleton (replaces fullScreen={false} spinner) ───── */
export const InlineSkeleton = ({ rows = 4, className = '' }) => (
  <div className={`animate-pulse space-y-3 py-6 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-3 px-2">
        <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2.5 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="w-16 h-5 bg-gray-100 rounded self-center" />
      </div>
    ))}
  </div>
);

/* ─── Card grid skeleton (courses, assessments list) ──────────────────── */
export const CardGridSkeleton = ({ layout: Layout, cols = 3, cards = 9 }) => {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  const content = (
    <div className="space-y-4">
      {/* Hero */}
      <div className="animate-pulse h-20 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />

      {/* Search bar */}
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-3">
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="w-24 h-10 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Cards grid */}
      <div className={`grid ${colClass} gap-4`}>
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="aspect-[16/9] bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-full" />
              <div className="h-5 bg-gray-200 rounded w-4/5" />
              <div className="h-3 bg-gray-100 rounded w-32" />
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <div className="w-5 h-5 rounded-full bg-gray-200" />
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="ml-auto h-3 bg-gray-200 rounded w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {content}
    </div>
  );
};

/* ─── Assessment list skeleton ─────────────────────────────────────────── */
export const AssessmentListSkeleton = ({ layout: Layout }) => {
  const content = (
    <div className="space-y-4">
      <div className="animate-pulse h-20 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl" />
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 p-3">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
          ))}
          <div className="ml-auto h-8 w-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
      <div className="animate-pulse bg-white/80 rounded-2xl border border-white/60 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-50 last:border-0 space-y-2">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-5 bg-gray-100 rounded-full w-16 ml-auto" />
                </div>
                <div className="flex gap-2">
                  <div className="h-3 bg-gray-100 rounded w-20" />
                  <div className="h-3 bg-gray-100 rounded w-16" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      {content}
    </div>
  );
};

/* ─── Course learn skeleton ────────────────────────────────────────────── */
export const CourseLearnSkeleton = ({ layout: Layout }) => {
  const content = (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white animate-pulse p-4 space-y-3 hidden lg:block">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-2 bg-gray-200 rounded-full mt-4" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center p-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1 h-3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 flex flex-col animate-pulse">
        <div className="h-12 bg-white border-b border-gray-100 px-4 flex items-center gap-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-100 rounded flex-1" />
          <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="flex-1 p-6 space-y-4 overflow-auto">
          <div className="aspect-video bg-gray-200 rounded-xl max-w-3xl" />
          <div className="h-6 bg-gray-200 rounded w-1/2 max-w-md" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${90 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return content;
};

/* ─── Student assessment take skeleton ────────────────────────────────── */
export const AssessmentTakeSkeleton = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 bg-gray-200 rounded w-2/3" />
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="space-y-3 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 border border-gray-100 rounded-xl">
              <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
              <div className="h-4 bg-gray-100 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <div className="h-10 w-24 bg-gray-200 rounded-xl" />
        <div className="h-10 w-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  </div>
);

/* ─── Profile skeleton ────────────────────────────────────────────────── */
export const ProfileSkeleton = ({ layout: Layout }) => {
  const content = (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );

  if (Layout) return <Layout>{content}</Layout>;
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">{content}</div>
  );
};

/* ─── ButtonSpinner replacement ────────────────────────────────────────── */
// Keep the same API as before for button loading states
import { Loader2 } from 'lucide-react';
export const ButtonSpinner = ({ text = 'Loading...' }) => (
  <span className="flex items-center justify-center gap-2">
    <Loader2 className="h-5 w-5 animate-spin" />
    {text}
  </span>
);

/* ─── Default export: backward-compatible replacement for LoadingSpinner ── */
// Maps old LoadingSpinner props to the right skeleton variant
const SkeletonLoader = ({
  fullScreen = true,
  // These old props are accepted but ignored (no-op) for backward compat
  message,
  submessage,
  icon,
}) => {
  if (!fullScreen) return <InlineSkeleton />;
  return <PageSkeleton />;
};

export default SkeletonLoader;