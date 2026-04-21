// src/pages/ProfileDashboard.jsx — Student Dashboard v3
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import {
  jobAPI, courseAPI, assessmentAttemptAPI,
} from '../api/Api';
import StudentLayout from '../components/layout/StudentLayout';
import {
  Briefcase, ChevronRight, Star, Clock, Users,
  BookOpen, ArrowRight, ClipboardList, CheckCircle2,
  PlayCircle, Building2, MapPin, ExternalLink,
  CircleDot, ChevronDown, ChevronUp, Target,
  BarChart2, GraduationCap, BookMarked, TrendingUp,
  Trophy, Medal, Zap, User,                         // icons
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 36e5);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1d ago' : `${d}d ago`;
};
const fmtDate = (ds) => {
  if (!ds) return '';
  return new Date(ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const safeNum = (v, f = 0) => (typeof v === 'number' && !isNaN(v) ? v : f);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ className = '' }) => <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;

// ─── Section Header ───────────────────────────────────────────────────────────
const SH = ({ title, count, cta, onCta, icon: Icon }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <h2 className="text-[15px] md:text-[16px] font-bold text-gray-900 tracking-tight">{title}</h2>
      {count > 0 && (
        <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">{count}</span>
      )}
    </div>
    {cta && (
      <button onClick={onCta} className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 group">
        {cta}<ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    )}
  </div>
);

// ─── Profile Ring ─────────────────────────────────────────────────────────────
const ProfileRing = ({ pct, initials }) => {
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (circ * pct) / 100;
  const clr = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} stroke="#f1f5f9" strokeWidth="5" fill="#f8fafc" />
        <circle cx="48" cy="48" r={r} stroke={clr} strokeWidth="5" fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-[16px] font-bold text-gray-800">{initials}</span>
        <span className="text-[9px] font-semibold" style={{ color: clr }}>{pct}%</span>
      </div>
    </div>
  );
};

// ─── Quick Stat Tile ──────────────────────────────────────────────────────────
const Tile = ({ icon: Icon, label, value, sub, iconColor, iconBg, onClick }) => (
  <button onClick={onClick}
    className="text-left bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:border-gray-200 transition-all duration-200 group">
    <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
      <Icon style={{ width: 17, height: 17 }} className={iconColor} />
    </div>
    <p className="text-[22px] font-extrabold text-gray-900 leading-none">{value}</p>
    <p className="text-[12px] font-semibold text-gray-600 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
  </button>
);

// ─── Assessment Card ──────────────────────────────────────────────────────────
const AssessmentCard = ({ a, onStart }) => {
  const taken = a.score !== null && a.score !== undefined;
  const pass = (a.score || 0) >= 70;
  return (
    <div onClick={onStart}
      className="group bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-blue-200 hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] transition-all duration-200">
      <div className="flex gap-3">
        <div className={`w-11 h-11 rounded-xl ${a.iconBg} flex items-center justify-center text-xl flex-shrink-0 border border-gray-100`}>
          {a.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-[13px] text-gray-900 leading-snug line-clamp-2 flex-1">{a.title}</h4>
            {taken && <span className={`text-[11px] font-bold flex-shrink-0 ${pass ? 'text-emerald-600' : 'text-amber-600'}`}>{a.score}%</span>}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{a.questions} questions · {a.duration}</p>
          {taken ? (
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pass ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${a.score}%`, transition: 'width 0.7s ease' }} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-2">
              <CircleDot className="w-3 h-3 text-blue-300" />
              <span className="text-[10px] text-gray-400 font-medium">Not attempted</span>
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); onStart?.(); }}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 group/b">
            <PlayCircle className="w-3.5 h-3.5" />
            {taken ? 'Retake' : 'Start test'}
            <ArrowRight className="w-3 h-3 opacity-0 group-hover/b:opacity-100 group-hover/b:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────
const CourseCard = ({ c, onClick }) => (
  <div onClick={onClick}
    className="group bg-white border border-gray-100 rounded-2xl overflow-hidden cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-200 flex flex-col">
    <div className={`h-[88px] bg-gradient-to-br ${c.thumbBg} flex items-center justify-center relative overflow-hidden flex-shrink-0`}>
      <span className="text-3xl relative z-10">{c.icon}</span>
      <div className="absolute inset-0 bg-black/10" />
      {c.badge && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-black/25 text-white uppercase tracking-wide">{c.badge}</span>
      )}
    </div>
    <div className="p-3 flex-1 flex flex-col">
      <h4 className="font-semibold text-[12px] text-gray-900 leading-snug line-clamp-2 mb-1">{c.title}</h4>
      <p className="text-[10px] text-gray-400 mb-2">{c.provider}</p>
      <div className="flex items-center gap-1 mb-2">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-[11px] font-semibold text-gray-700">{c.rating}</span>
        <span className="text-[10px] text-gray-400">({c.reviews >= 1000 ? `${(c.reviews / 1000).toFixed(1)}k` : c.reviews})</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.enrolled?.toLocaleString()}</span>
      </div>
    </div>
    <div className="flex items-center justify-between px-3 py-2.5 border-t border-gray-50 bg-gray-50/50">
      <span className="text-[13px] font-bold text-gray-900">{c.price}</span>
      <button onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
        Enroll
      </button>
    </div>
  </div>
);

// ─── Enrolled Course Progress ─────────────────────────────────────────────────
const EnrolledCard = ({ e, onClick }) => {
  const p = safeNum(e.progress, 0);
  const clr = p >= 80 ? 'bg-emerald-500' : p >= 40 ? 'bg-blue-500' : 'bg-amber-400';
  const tc = p >= 80 ? 'text-emerald-600' : p >= 40 ? 'text-blue-600' : 'text-amber-600';
  return (
    <div onClick={onClick}
      className="group bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-blue-200 hover:shadow-[0_4px_16px_rgba(59,130,246,0.08)] transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${e.thumbBg} flex items-center justify-center text-xl flex-shrink-0`}>
          {e.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[13px] text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{e.title}</h4>
          <p className="text-[11px] text-gray-400 mt-0.5 mb-2">{e.provider}</p>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-400">Progress</span>
            <span className={`font-bold ${tc}`}>{p}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${clr}`} style={{ width: `${p}%`, transition: 'width 0.8s ease' }} />
          </div>
          {p >= 100
            ? <div className="mt-2 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[11px] font-semibold text-emerald-600">Completed!</span></div>
            : <button onClick={(e2) => { e2.stopPropagation(); onClick?.(); }}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 group/b">
                <PlayCircle className="w-3.5 h-3.5" />{p === 0 ? 'Start' : 'Continue'}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover/b:opacity-100 transition-all" />
              </button>}
        </div>
      </div>
    </div>
  );
};

// ─── Job Row ──────────────────────────────────────────────────────────────────
const JobRow = ({ job, onClick }) => (
  <div onClick={onClick}
    className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3.5 cursor-pointer hover:border-blue-100 hover:shadow-[0_2px_12px_rgba(59,130,246,0.07)] transition-all duration-200">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 border border-blue-100">
      <span className="font-bold text-blue-600 text-[13px]">
        {(job.company?.name || job.companyName || 'C')[0].toUpperCase()}
      </span>
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-[13px] text-gray-900 group-hover:text-blue-600 transition-colors truncate">
        {job.title || job.jobTitle}
      </h4>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-[11px] text-gray-500 flex items-center gap-1">
          <Building2 className="w-3 h-3" />{job.company?.name || job.companyName || 'ICL Partner'}
        </span>
        {(job.location || job.jobLocation) && (
          <>
            <span className="text-gray-200">·</span>
            <span className="text-[11px] text-gray-400 flex items-center gap-1 hidden sm:flex">
              <MapPin className="w-3 h-3" />{job.location || job.jobLocation}
            </span>
          </>
        )}
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <ExternalLink className="w-3.5 h-3.5 text-gray-200 group-hover:text-blue-400 transition-colors" />
      <span className="text-[10px] text-gray-400">{timeAgo(job.createdAt)}</span>
    </div>
  </div>
);

// ─── Score Trend Line Chart ───────────────────────────────────────────────────
const ScoreTrendChart = ({ history }) => {
  const MAX_W = 480, H = 110, PAD_X = 32, PAD_Y = 18, PASS = 70;

  const data = useMemo(() => {
    const raw = [...history]
      .sort((a, b) => new Date(a.submitted_at || a.createdAt) - new Date(b.submitted_at || b.createdAt))
      .slice(-10)
      .map(h => ({
        score: safeNum(h.score_percentage || h.percentage || h.score, 0),
        label: fmtDate(h.submitted_at || h.createdAt),
        title: h.assessment_id?.title || h.title || 'Test',
      }));
    return raw;
  }, [history]);

  if (data.length < 2) return null;

  const n = data.length;
  const w = MAX_W;
  const xs = data.map((_, i) => PAD_X + (i / (n - 1)) * (w - 2 * PAD_X));
  const ys = data.map(d => PAD_Y + (1 - d.score / 100) * (H - 2 * PAD_Y));
  const passY = PAD_Y + (1 - PASS / 100) * (H - 2 * PAD_Y);

  let path = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    path += ` C ${cpx} ${ys[i - 1]}, ${cpx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
  }

  let area = path;
  area += ` L ${xs[n - 1]} ${H - PAD_Y} L ${xs[0]} ${H - PAD_Y} Z`;

  const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / n);
  const trend = data[n - 1].score - data[0].score;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Score Trend</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
            </span>
            <span className="text-[10px] text-gray-400">vs first</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400">Avg </span>
            <span className="text-[12px] font-bold text-blue-600">{avg}%</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden" style={{ marginLeft: -4, marginRight: -4 }}>
        <svg viewBox={`0 0 ${w} ${H}`} className="w-full" style={{ height: 120 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map(v => {
            const y = PAD_Y + (1 - v / 100) * (H - 2 * PAD_Y);
            return (
              <g key={v}>
                <line x1={PAD_X} y1={y} x2={w - PAD_X} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={PAD_X - 6} y={y + 3.5} textAnchor="end" fontSize="8" fill="#cbd5e1">{v}</text>
              </g>
            );
          })}
          <line x1={PAD_X} y1={passY} x2={w - PAD_X} y2={passY}
            stroke="#10b981" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          <text x={w - PAD_X + 3} y={passY + 3.5} fontSize="8" fill="#10b981" opacity="0.7">Pass</text>
          <path d={area} fill="url(#scoreGrad)" />
          <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((d, i) => {
            const clr = d.score >= 80 ? '#10b981' : d.score >= 70 ? '#3b82f6' : '#f59e0b';
            return (
              <g key={i}>
                <circle cx={xs[i]} cy={ys[i]} r="4.5" fill="white" stroke={clr} strokeWidth="2" />
                <text x={xs[i]} y={ys[i] - 7} textAnchor="middle" fontSize="8" fontWeight="700" fill={clr}>{d.score}</text>
                <text x={xs[i]} y={H - 3} textAnchor="middle" fontSize="7.5" fill="#94a3b8">{d.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ─── Skill Demand Chart ───────────────────────────────────────────────────────
const SkillDemandChart = ({ jobs, studentSkills, loading }) => {
  const skillMap = useMemo(() => {
    const map = {};
    jobs.forEach(j => {
      const skills = Array.isArray(j.preferredSkills) ? j.preferredSkills
        : Array.isArray(j.requiredSkills) ? j.requiredSkills
        : Array.isArray(j.skills) ? j.skills : [];
      skills.forEach(s => {
        if (!s) return;
        const k = typeof s === 'string' ? s.trim() : (s.name || '');
        if (!k) return;
        map[k] = (map[k] || 0) + 1;
      });
    });
    return map;
  }, [jobs]);

  const topSkills = useMemo(() =>
    Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({
        name,
        count,
        hasIt: studentSkills.some(s =>
          (typeof s === 'string' ? s : s?.name || '').toLowerCase() === name.toLowerCase()
        ),
      })),
    [skillMap, studentSkills]
  );

  const maxCount = topSkills[0]?.count || 1;
  const matched = topSkills.filter(s => s.hasIt).length;

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <Sk className="h-5 w-48 mb-4" />
        {[0,1,2,3,4,5].map(i => <Sk key={i} className="h-7 w-full mb-2" />)}
      </div>
    );
  }

  if (topSkills.length === 0) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Skill Demand in Market</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-blue-600">{matched}</span>
          <span className="text-[11px] text-gray-400">/ {topSkills.length} you have</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {topSkills.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-[120px] flex-shrink-0 flex items-center justify-between">
              <span className="text-[12px] font-medium text-gray-700 truncate max-w-[100px]">{s.name}</span>
              {s.hasIt && (
                <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 ml-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.hasIt ? 'bg-blue-500' : 'bg-gray-300'}`}
                  style={{ width: `${(s.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 w-8 text-right font-medium">{s.count} JD{s.count > 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] text-gray-500">You have this skill</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-gray-300" />
          <span className="text-[10px] text-gray-500">Skill gap</span>
        </div>
      </div>
    </div>
  );
};

// ─── Leaderboard Snapshot ────────────────────────────────────────────────────
const LeaderboardCard = ({ data, assessmentTitle, loading, onView }) => {
  if (loading) return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <Sk className="h-5 w-40 mb-4" />
      {[0,1,2,3].map(i => <Sk key={i} className="h-10 w-full mb-2" />)}
    </div>
  );
  if (!data || data.length === 0) return null;

  const myEntry = data.find(e => e.is_me);
  const top3 = data.slice(0, 3);
  const medalColors = ['text-amber-500','text-gray-400','text-orange-500'];
  const medalBgs = ['bg-amber-50 border-amber-100','bg-gray-50 border-gray-100','bg-orange-50 border-orange-100'];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-gray-400" />
          <h3 className="text-[14px] font-bold text-gray-900">Leaderboard</h3>
        </div>
        <button onClick={onView} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
          View all<ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
      {assessmentTitle && (
        <p className="text-[11px] text-gray-400 mb-3 leading-snug line-clamp-1">{assessmentTitle}</p>
      )}
      <div className="flex gap-2 mb-3">
        {top3.map((e, i) => (
          <div key={i} className={`flex-1 flex flex-col items-center p-2.5 rounded-xl border ${medalBgs[i]} ${e.is_me ? 'ring-2 ring-blue-200' : ''}`}>
            <span className="text-[18px]">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span className={`text-[10px] font-bold mt-1 ${medalColors[i]}`}>#{e.rank}</span>
            <span className="text-[10px] text-gray-600 font-medium mt-0.5 text-center leading-tight line-clamp-1">
              {e.is_me ? 'You' : (e.student_name || e.name || `Rank ${e.rank}`)}
            </span>
            {e.score_percentage !== undefined && (
              <span className="text-[10px] text-gray-400 mt-0.5">{Math.round(e.score_percentage)}%</span>
            )}
          </div>
        ))}
      </div>
      {myEntry && myEntry.rank > 3 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5">
          <Medal className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-[12px] font-bold text-blue-700">Your rank: #{myEntry.rank}</span>
            {myEntry.score_percentage !== undefined && (
              <span className="text-[11px] text-blue-500 ml-2">{Math.round(myEntry.score_percentage)}%</span>
            )}
          </div>
          <Zap className="w-3.5 h-3.5 text-blue-400" />
        </div>
      )}
    </div>
  );
};

// ─── Sidebar Score Ring ───────────────────────────────────────────────────────
const ScoreRing = ({ avg, attempted }) => {
  const r = 30, circ = 2 * Math.PI * r;
  const offset = circ - (circ * avg) / 100;
  const clr = avg >= 80 ? '#10b981' : avg >= 60 ? '#3b82f6' : '#f59e0b';
  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center flex-shrink-0">
        <svg width="72" height="72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} stroke="#f1f5f9" strokeWidth="5" fill="#f8fafc" />
          <circle cx="36" cy="36" r={r} stroke={clr} strokeWidth="5" fill="none"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-extrabold text-gray-800">{avg}%</span>
        </div>
      </div>
      <div>
        <p className="text-[13px] font-bold text-gray-800">Avg Score</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{attempted} assessment{attempted !== 1 ? 's' : ''}</p>
        <p className="text-[10px] mt-1 font-semibold" style={{ color: clr }}>
          {avg >= 80 ? 'Excellent 🎉' : avg >= 60 ? 'Good 👍' : avg > 0 ? 'Keep going 💪' : 'Start testing!'}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const ProfileDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, profileCompleteness, isLoading, fetchProfile } = useProfile();

  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTitle, setLeaderboardTitle] = useState('');

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(false);

  // ── Loaders ──
  const loadJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const res = await jobAPI.getAllJobs({ status: 'Active', limit: 10, sortBy: '-createdAt' });
      setJobs(Array.isArray(res?.jobs || res?.data || res?.results) ? (res.jobs || res.data || res.results) : []);
    } catch { } finally { setLoadingJobs(false); }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const res = await courseAPI.getAllCourses({ limit: 4, recommended: 'true' });
      const list = res?.courses || res?.data || res?.results || [];
      const bgs = ['from-blue-700 to-blue-500','from-violet-700 to-purple-500','from-emerald-700 to-teal-500','from-rose-700 to-pink-500'];
      const badges = ['Bestseller','Trending','New','Popular'];
      const icons = ['⚛️','🧠','☁️','🎨'];
      setCourses(
        (Array.isArray(list) ? list : []).slice(0, 4).map((c, i) => ({
          id: c._id || i, _id: c._id,
          title: c.title || 'Course',
          provider: c.instructor?.name || c.provider || 'ICL Academy',
          rating: c.rating?.average?.toFixed(1) || '4.5',
          reviews: c.rating?.count || 1200,
          duration: typeof c.duration === 'object' ? (c.duration.hours ? `${c.duration.hours} hrs` : 'Flexible') : (c.duration ? String(c.duration) : 'Flexible'),
          enrolled: typeof c.enrolledCount === 'object' ? (c.enrolledCount.count || 1500) : (c.enrolledCount || 1500),
          badge: badges[i % 4],
          thumbBg: bgs[i % 4],
          icon: c.icon || icons[i % 4],
          price: typeof c.price === 'object' ? (c.price.original === 0 ? 'Free' : `₹${c.price.discounted || c.price.original}`) : (c.price === 0 || !c.price ? 'Free' : `₹${c.price}`),
        }))
      );
    } catch { } finally { setLoadingCourses(false); }
  }, []);

  const loadAssessments = useCallback(async () => {
    try {
      setLoadingAssessments(true);
      const res = await assessmentAttemptAPI.getMyAssignedAssessments();
      const list = res?.assessments || res?.data || res?.results || [];
      const bgs = ['bg-blue-50','bg-violet-50','bg-emerald-50','bg-amber-50'];
      const icons = ['💻','🧠','⚛️','📊'];
      setAssessments(
        (Array.isArray(list) ? list : [])
          .filter(a => a.status === 'active')
          .slice(0, 4)
          .map((a, i) => ({
            id: a._id || i, _id: a._id,
            title: a.jd_id?.jobTitle || a.title || a.skill_id?.name || 'Skill Assessment',
            questions: a.questions?.length || a.total_questions || 30,
            duration: a.duration_minutes ? `${a.duration_minutes} min` : 'Flexible',
            iconBg: bgs[i % 4], icon: icons[i % 4],
            score: a.score ?? null,
          }))
      );
    } catch { } finally { setLoadingAssessments(false); }
  }, []);

  const loadEnrollments = useCallback(async () => {
    try {
      setLoadingEnrollments(true);
      const res = await courseAPI.getMyEnrollments();
      const list = res?.enrollments || res?.courses || res?.data || res?.results || [];
      const bgs = ['from-blue-400 to-blue-300','from-violet-400 to-purple-300','from-emerald-400 to-teal-300','from-rose-400 to-pink-300','from-amber-400 to-orange-300'];
      const icons = ['⚛️','🧠','☁️','🎨','📐'];
      setEnrollments(
        (Array.isArray(list) ? list : []).slice(0, 6).map((e, i) => {
          const course = e.course_id || e.course || e;
          const pv = typeof e.progress === 'number' ? e.progress
            : typeof e.progressPercentage === 'number' ? e.progressPercentage
            : typeof e.completionPercentage === 'number' ? e.completionPercentage : 0;
          return {
            id: course._id || e._id || i, _id: course._id || e._id,
            title: course.title || e.courseTitle || 'Course',
            provider: course.instructor?.name || course.provider || 'ICL Academy',
            progress: Math.min(100, Math.round(pv)),
            thumbBg: bgs[i % 5], icon: course.icon || icons[i % 5],
          };
        })
      );
    } catch { } finally { setLoadingEnrollments(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await assessmentAttemptAPI.getMyHistory();
      const attempts = (res?.attempts || res?.data || [])
        .filter(a => a.assessment_id?.status !== 'cancelled');
      setHistory(attempts);

      const candidate = [...attempts]
        .sort((a, b) => new Date(b.submitted_at || b.createdAt) - new Date(a.submitted_at || a.createdAt))
        .find(a => a.assessment_id?.leaderboard_published === true);

      if (candidate?.assessment_id?._id) {
        setLoadingLeaderboard(true);
        try {
          const lb = await assessmentAttemptAPI.getLeaderboard(candidate.assessment_id._id);
          if (lb?.leaderboard?.length > 0) {
            setLeaderboard(lb.leaderboard);
            setLeaderboardTitle(candidate.assessment_id?.title || candidate.assessment_id?.skill_id?.name || '');
          }
        } catch { }
        setLoadingLeaderboard(false);
      }
    } catch { } finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => {
    fetchProfile();
    loadJobs();
    loadCourses();
    loadAssessments();
    loadEnrollments();
    loadHistory();
  }, []);

  // ── Derived ──
  const name = profile?.fullName || user?.fullName || user?.name || 'Student';
  const firstName = name.split(' ')[0];
  const initials = (() => {
    const p = name.split(' ');
    return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  })();
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  const pct = profileCompleteness || 0;
  const studentSkills = profile?.primarySkills || [];

  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, h) => s + safeNum(h.score_percentage || h.percentage || h.score, 0), 0) / history.length)
    : 0;

  const matchedJobsCount = useMemo(() => {
    if (!studentSkills.length || !jobs.length) return 0;
    const skillNames = studentSkills.map(s =>
      (typeof s === 'string' ? s : s?.name || '').toLowerCase()
    );
    return jobs.filter(job => {
      const jobSkills = Array.isArray(job.preferredSkills) ? job.preferredSkills
        : Array.isArray(job.requiredSkills) ? job.requiredSkills
        : Array.isArray(job.skills) ? job.skills : [];
      return jobSkills.some(s => {
        const k = (typeof s === 'string' ? s : s?.name || '').toLowerCase();
        return skillNames.includes(k);
      });
    }).length;
  }, [jobs, studentSkills]);

  // ── Matched jobs list for sidebar (derived from already-fetched data) ────────
  const matchedJobsList = useMemo(() => {
    if (!studentSkills.length || !jobs.length) return [];
    const skillNames = studentSkills.map(s =>
      (typeof s === 'string' ? s : s?.name || '').toLowerCase()
    );
    return jobs.filter(job => {
      const jobSkills = Array.isArray(job.preferredSkills) ? job.preferredSkills
        : Array.isArray(job.requiredSkills) ? job.requiredSkills
        : Array.isArray(job.skills) ? job.skills : [];
      return jobSkills.some(s =>
        skillNames.includes((typeof s === 'string' ? s : s?.name || '').toLowerCase())
      );
    }).slice(0, 3);
  }, [jobs, studentSkills]);

  const inProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const visibleJobs = showAllJobs ? jobs : jobs.slice(0, 5);

  if (isLoading && !profile) {
    return (
      <StudentLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="min-h-screen bg-[#f5f6f8] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1240px] mx-auto">

          {/* ── Mobile Profile Card ── */}
          <div className="md:hidden mb-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-700 text-[16px]">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold text-gray-900 truncate">{name}</h2>
                  <p className="text-[11px] text-gray-400">{profile?.candidateType || profile?.currentRole || 'Student'}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                  <span>Profile completeness</span>
                  <span className="font-semibold text-blue-600">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : '#3b82f6' }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

            {/* ════ SIDEBAR ════ */}
            <aside className="hidden md:block md:col-span-3">
              <div className="space-y-4">

                {/* Profile */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <div className="mb-4"><ProfileRing pct={pct} initials={initials} /></div>
                  <h2 className="text-[15px] font-bold text-gray-900">{name}</h2>
                  <p className="text-[12px] text-gray-400 mt-1 leading-snug">
                    {profile?.candidateType || profile?.currentRole || user?.college?.name || 'ICL Student'}
                  </p>
                  {profile?.updatedAt && (
                    <p className="text-[10px] text-gray-300 mt-1">Updated {(() => { const d = new Date(profile.updatedAt); return `${d.getDate()} ${d.toLocaleString('en',{month:'short'})} ${d.getFullYear()}`; })()}</p>
                  )}
                  <button onClick={() => navigate('/profile/my-info')}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-colors">
                    View Profile
                  </button>
                </div>

                {/* Score Summary */}
                {!loadingHistory && history.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <ScoreRing avg={avgScore} attempted={history.length} />
                  </div>
                )}

                {/* Skills */}
                {studentSkills.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Your Skills</h3>
                      <span className="text-[10px] text-gray-400">{studentSkills.length} skills</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {studentSkills.slice(0, 10).map((skill, i) => {
                        const c = ['bg-blue-50 text-blue-700','bg-violet-50 text-violet-700','bg-emerald-50 text-emerald-700','bg-amber-50 text-amber-700','bg-rose-50 text-rose-700','bg-teal-50 text-teal-700','bg-indigo-50 text-indigo-700','bg-orange-50 text-orange-700','bg-cyan-50 text-cyan-700','bg-pink-50 text-pink-700'];
                        return <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c[i % c.length]}`}>{typeof skill === 'string' ? skill : skill?.name || ''}</span>;
                      })}
                    </div>
                  </div>
                )}

                {/* Learning Summary */}
                {!loadingEnrollments && enrollments.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">Learning Summary</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Enrolled', val: enrollments.length, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'In Progress', val: inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
                        { label: 'Completed', val: enrollments.filter(e => e.progress >= 100).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[12px] text-gray-600">{s.label}</span>
                          <span className={`text-[13px] font-bold ${s.color} ${s.bg} px-2.5 py-0.5 rounded-full`}>{s.val}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => navigate('/dashboard/student/courses')}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 py-1.5 rounded-xl border border-blue-100 hover:border-blue-200 bg-blue-50/50 transition-colors">
                      <BookOpen className="w-3.5 h-3.5" />Browse courses
                    </button>
                  </div>
                )}

                {/* ── NEW: Quick Actions ─────────────────────────────────────
                    Pure navigation shortcuts — no extra API calls needed.
                ─────────────────────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                  <div className="space-y-1">
                    {[
                      { icon: ClipboardList, label: 'Take Assessment',  path: '/dashboard/student/assessments', color: 'text-blue-600',    bg: 'bg-blue-50'    },
                      { icon: Briefcase,     label: 'Browse Jobs',       path: '/dashboard/student/jobs',        color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { icon: BookOpen,      label: 'Explore Courses',   path: '/dashboard/student/courses',     color: 'text-violet-600',  bg: 'bg-violet-50'  },
                      { icon: User,          label: 'Update Profile',    path: '/profile/my-info',               color: 'text-amber-600',   bg: 'bg-amber-50'   },
                    ].map((item, i) => (
                      <button key={i} onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-gray-50 transition-colors group text-left">
                        <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                          <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        </div>
                        <span className="text-[12px] font-medium text-gray-700 group-hover:text-gray-900 flex-1">{item.label}</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── NEW: Recent Tests ─────────────────────────────────────
                    Uses live `history` state already fetched above.
                    Shows last 3 attempts with score + date — different
                    presentation from the trend chart in the main feed.
                ─────────────────────────────────────────────────────────── */}
                {!loadingHistory && history.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Recent Tests</h3>
                      <button onClick={() => navigate('/dashboard/student/assessments')}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                        All <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[...history]
                        .sort((a, b) => new Date(b.submitted_at || b.createdAt) - new Date(a.submitted_at || a.createdAt))
                        .slice(0, 3)
                        .map((h, i) => {
                          const score = safeNum(h.score_percentage || h.percentage || h.score, 0);
                          const pass = score >= 70;
                          return (
                            <div key={i} className="flex items-center gap-2.5 py-1">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${pass ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                <span className={`text-[11px] font-extrabold ${pass ? 'text-emerald-600' : 'text-amber-600'}`}>{score}%</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
                                  {h.assessment_id?.title || h.title || 'Assessment'}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(h.submitted_at || h.createdAt)}</p>
                              </div>
                              {pass
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                : <CircleDot className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* ── NEW: Matched Jobs mini-list ───────────────────────────
                    Uses live `jobs` + `studentSkills` already in state.
                    Shows up to 3 skill-matched jobs as a quick reference;
                    different from the full job list in the main feed.
                ─────────────────────────────────────────────────────────── */}
                {!loadingJobs && matchedJobsList.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Matched Jobs</h3>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        {matchedJobsCount}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {matchedJobsList.map((job, i) => (
                        <button key={i} onClick={() => navigate(`/dashboard/student/jobs/${job._id}`)}
                          className="w-full flex items-center gap-2.5 py-1.5 text-left group">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[11px] font-bold text-blue-600">
                              {(job.company?.name || job.companyName || 'C')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors leading-tight">
                              {job.title || job.jobTitle}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {job.company?.name || job.companyName || 'ICL Partner'}
                            </p>
                          </div>
                          <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                    <button onClick={() => navigate('/dashboard/student/jobs')}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 py-1.5 rounded-xl border border-blue-100 hover:border-blue-200 bg-blue-50/50 transition-colors">
                      View all jobs <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

              </div>
            </aside>

            {/* ════ FEED ════ */}
            <div className="col-span-1 md:col-span-9 space-y-6">

              {/* Greeting */}
              <div>
                <h1 className="text-[19px] md:text-[22px] font-bold text-gray-900 tracking-tight">
                  {greeting}, <span className="text-blue-600">{firstName}</span> 👋
                </h1>
                <p className="text-[12px] text-gray-400 mt-1">Here's your career overview for today.</p>
              </div>

              {/* ── Quick Stats ── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Tile icon={ClipboardList} label="Assessments Done"
                  value={loadingHistory ? '—' : history.length}
                  sub={loadingHistory ? '' : (history.length > 0 ? `Avg ${avgScore}%` : 'None yet')}
                  iconColor="text-blue-600" iconBg="bg-blue-50"
                  onClick={() => navigate('/dashboard/student/assessments')} />
                <Tile icon={BookMarked} label="Enrolled Courses"
                  value={loadingEnrollments ? '—' : enrollments.length}
                  sub={loadingEnrollments ? '' : `${inProgress} in progress`}
                  iconColor="text-violet-600" iconBg="bg-violet-50"
                  onClick={() => navigate('/dashboard/student/courses')} />
                <Tile icon={Briefcase} label="Jobs Matched"
                  value={loadingJobs ? '—' : matchedJobsCount}
                  sub={loadingJobs ? '' : (matchedJobsCount > 0 ? 'Based on your skills' : 'Add skills to match')}
                  iconColor="text-emerald-600" iconBg="bg-emerald-50"
                  onClick={() => navigate('/dashboard/student/jobs')} />
                <Tile icon={TrendingUp} label="Profile Score"
                  value={`${pct}%`}
                  sub={pct < 80 ? 'Needs improvement' : 'Strong profile!'}
                  iconColor="text-amber-600" iconBg="bg-amber-50"
                  onClick={() => navigate('/profile/my-info')} />
              </div>

              {/* ── 1. Pending Assessments ── */}
              <section>
                <SH title="Pending Assessments" count={assessments.length}
                  icon={ClipboardList} cta="View all" onCta={() => navigate('/dashboard/student/assessments')} />
                {loadingAssessments ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[0,1].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                        <Sk className="w-11 h-11 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2"><Sk className="h-3.5 w-3/4" /><Sk className="h-2.5 w-1/2" /><Sk className="h-1.5 w-full mt-2" /></div>
                      </div>
                    ))}
                  </div>
                ) : assessments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assessments.map(a => (
                      <AssessmentCard key={a.id} a={a}
                        onStart={() => navigate(`/dashboard/student/assessments/${a._id}/take`)} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                    <p className="text-[13px] text-gray-500 font-medium">All caught up!</p>
                    <p className="text-[11px] text-gray-400 mt-1">No pending assessments right now.</p>
                    <button onClick={() => navigate('/dashboard/student/assessments')}
                      className="mt-3 text-[12px] text-blue-600 font-semibold hover:underline">
                      View history →
                    </button>
                  </div>
                )}
              </section>

              {/* ── 2. Score Trend Chart ── */}
              {!loadingHistory && history.length >= 2 && (
                <section>
                  <SH title="Your Score Trend" icon={BarChart2}
                    cta="Full history" onCta={() => navigate('/dashboard/student/assessments')} />
                  <ScoreTrendChart history={history} />
                </section>
              )}

              {/* ── 3. Leaderboard Snapshot ── */}
              {(loadingLeaderboard || leaderboard.length > 0) && (
                <section>
                  <SH title="Assessment Leaderboard" icon={Trophy}
                    cta="View assessments" onCta={() => navigate('/dashboard/student/assessments')} />
                  <LeaderboardCard
                    data={leaderboard}
                    assessmentTitle={leaderboardTitle}
                    loading={loadingLeaderboard}
                    onView={() => navigate('/dashboard/student/assessments')}
                  />
                </section>
              )}

              {/* ── 4. Latest Jobs ── */}
              <section>
                <SH title="Latest Job Openings" count={jobs.length}
                  icon={Briefcase} cta="View all" onCta={() => navigate('/dashboard/student/jobs')} />
                {loadingJobs ? (
                  <div className="space-y-2.5">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5 flex gap-3">
                        <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2"><Sk className="h-3.5 w-2/3" /><Sk className="h-2.5 w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : jobs.length > 0 ? (
                  <div className="space-y-2.5">
                    {visibleJobs.map(job => (
                      <JobRow key={job._id || job.id} job={job}
                        onClick={() => navigate(`/dashboard/student/jobs/${job._id}`)} />
                    ))}
                    {jobs.length > 5 && (
                      <button onClick={() => setShowAllJobs(!showAllJobs)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[12px] font-semibold text-gray-500 hover:text-gray-700 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                        {showAllJobs ? 'Show less' : `Show ${jobs.length - 5} more`}
                        {showAllJobs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <Briefcase className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-[13px] text-gray-500">No active job openings right now</p>
                  </div>
                )}
              </section>

              {/* ── 5. My Learning Progress ── */}
              {(loadingEnrollments || enrollments.length > 0) && (
                <section>
                  <SH title="My Learning" count={enrollments.length}
                    icon={GraduationCap} cta="Browse courses" onCta={() => navigate('/dashboard/student/courses')} />
                  {loadingEnrollments ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                          <Sk className="w-10 h-10 rounded-xl flex-shrink-0" />
                          <div className="flex-1 space-y-2"><Sk className="h-3 w-3/4" /><Sk className="h-2.5 w-1/2" /><Sk className="h-1.5 w-full mt-3" /></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {enrollments.map(e => (
                        <EnrolledCard key={e.id} e={e}
                          onClick={() => navigate(`/dashboard/student/courses/${e._id}`)} />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* ── 6. Market Skill Demand ── */}
              <section>
                <SH title="Market Skill Demand" icon={Target}
                  cta="Explore jobs" onCta={() => navigate('/dashboard/student/jobs')} />
                <SkillDemandChart jobs={jobs} studentSkills={studentSkills} loading={loadingJobs} />
              </section>

              {/* ── 7. Recommended Courses ── */}
              <section>
                <SH title="Recommended Courses" count={courses.length}
                  icon={BookOpen} cta="Browse all" onCta={() => navigate('/dashboard/student/courses')} />
                {loadingCourses ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[0,1,2,3].map(i => (
                      <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        <Sk className="h-[88px] rounded-none" />
                        <div className="p-3 space-y-2"><Sk className="h-3 w-3/4" /><Sk className="h-2.5 w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : courses.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {courses.map(c => (
                      <CourseCard key={c.id} c={c}
                        onClick={() => navigate(`/dashboard/student/courses/${c._id}`)} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-[13px] text-gray-500">No courses available right now</p>
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProfileDashboard;