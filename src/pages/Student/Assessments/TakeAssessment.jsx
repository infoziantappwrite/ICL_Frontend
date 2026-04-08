// pages/Student/Assessments/TakeAssessment.jsx
// FULLY MERGED: Doc 1 UX/Design (3-column layout, QuestionPill, ComplexityBadge,
// TagChip, SampleCase, two-column briefing) + Doc 2 complete proctoring system
//
// FIXES APPLIED:
// 1. phase starts as 'loading' (not 'briefing') — briefing only renders after API data loads (Doc 1)
// 2. Auto-fullscreen on assessment begin — guard.requestFullscreen() with fallback (Doc 2)
// 3. Fullscreen broken in dev mode fixed — togglePageFullscreen still works independently
// 4. camera.startCamera() failure is surfaced to user, not silently swallowed
// 5. guard.isOnline destructure safety added

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send,
  AlertTriangle, CheckCircle2, SkipForward, X,
  Loader2, BookOpen, Target,
  Shield, ShieldAlert,
  ShieldCheck, Maximize, Lock, Maximize2, Minimize2
} from 'lucide-react';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';
import useProctoringGuard from '../../../hooks/useProctoringGuard';
import useCameraProctoring from '../../../hooks/useCameraProctoring';
import CameraOverlay from '../../../components/proctoring/CameraOverlay';
import CodeEditor from '../../../components/assessment/CodeEditor';

// ── Level config ──────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500'  },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500'   },
  Advanced:     { label: 'Advanced',     color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

// ── Utility: format seconds → MM:SS ──────────────────────────────
const formatTime = (seconds) => {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ── Shared Card Wrapper ───────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

// ── Question Status Pill (left sidebar) ──────────────────────────
const QuestionPill = ({ number, status, onClick, isCurrent }) => {
  const base = 'w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold cursor-pointer transition-all duration-150 select-none border';
  const styles = {
    current:    'bg-blue-600 text-white border-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.25)]',
    answered:   'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
    unanswered: 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600',
    flagged:    'bg-amber-50 text-amber-600 border-amber-300',
    skipped:    'bg-orange-50 text-orange-500 border-orange-200 hover:border-orange-400',
  };
  const style = isCurrent ? styles.current : styles[status] || styles.unanswered;
  return (
    <button onClick={onClick} className={`${base} ${style}`} title={`Question ${number}`}>
      {number}
    </button>
  );
};

// ── Complexity Badge ──────────────────────────────────────────────
const ComplexityBadge = ({ label, value }) => (
  <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200">
    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-[11px] font-bold text-blue-600 font-mono">{value}</span>
  </div>
);

// ── Tag Chip ──────────────────────────────────────────────────────
const TagChip = ({ label }) => {
  const colors = {
    'coding question': 'bg-blue-50 text-blue-700 border-blue-200',
    coding:            'bg-blue-50 text-blue-700 border-blue-200',
    strings:           'bg-emerald-50 text-emerald-700 border-emerald-200',
    arrays:            'bg-purple-50 text-purple-700 border-purple-200',
    default:           'bg-gray-100 text-gray-600 border-gray-200',
  };
  const cls = colors[label?.toLowerCase()] || colors.default;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
};

// ── Sample Test Case Card ─────────────────────────────────────────
const SampleCase = ({ index, input, output, explanation }) => (
  <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sample Case {index}</span>
    </div>
    <div className="grid grid-cols-2 divide-x divide-gray-200">
      <div className="p-3">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Input</p>
        <pre className="text-[12px] font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">{input}</pre>
      </div>
      <div className="p-3">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Output</p>
        <pre className="text-[12px] font-mono text-emerald-600 whitespace-pre-wrap leading-relaxed">{output}</pre>
      </div>
    </div>
    {explanation && (
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Explanation</p>
        <p className="text-[12px] text-gray-600 italic leading-relaxed">{explanation}</p>
      </div>
    )}
  </div>
);

// ── Timer ─────────────────────────────────────────────────────────
const Timer = ({ totalSeconds, onExpire }) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef(null);

  useEffect(() => {
    if (!totalSeconds) return;
    setRemaining(totalSeconds);
    ref.current = setInterval(() => {
      setRemaining(p => {
        if (p <= 1) { clearInterval(ref.current); onExpire?.(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [totalSeconds]);

  const isRed   = remaining < 60;
  const isAmber = remaining < 300;

  return (
    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-bold font-mono transition-all
      ${isRed   ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
      : isAmber ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-gray-50 text-gray-900 border border-gray-200'}`}>
      <Clock className={`w-3.5 h-3.5 ${isRed ? 'text-red-500' : isAmber ? 'text-amber-500' : 'text-blue-600'}`} />
      {formatTime(remaining)}
    </div>
  );
};

// ── Full-screen Loader ────────────────────────────────────────────
const FullLoader = ({ title, sub, pct }) => (
  <div className="h-screen w-screen bg-white flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-[13px] text-gray-500">{sub}</p>}
      {pct !== undefined && (
        <div className="w-48">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-1.5 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-2">{pct}% loaded</p>
        </div>
      )}
    </div>
  </div>
);

// ── Proctoring Warning Toast ──────────────────────────────────────
const ProctoringWarningToast = ({ violation, remaining, onDismiss }) => {
  if (!violation) return null;
  const isCritical = violation.severity === 'CRITICAL';
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-md w-full mx-4 animate-in slide-in-from-top-4 duration-300
        ${isCritical ? 'bg-red-600 border-red-700 text-white' : 'bg-amber-500 border-amber-600 text-white'}`}>
      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[14px] leading-tight">
          {isCritical ? '⚠ Proctoring Violation Detected' : '⚠ Warning'}
        </p>
        <p className="text-[12px] opacity-90 mt-0.5">{violation.label}</p>
        {isCritical && remaining > 0 && (
          <p className="text-[11px] opacity-80 mt-1 font-bold">
            {remaining} warning{remaining !== 1 ? 's' : ''} remaining before auto-submit
          </p>
        )}
      </div>
      <button onClick={onDismiss} className="p-1 opacity-70 hover:opacity-100 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Fullscreen Prompt Overlay ─────────────────────────────────────
// ── Fullscreen Violation Overlay ──────────────────────────────────
// Completely opaque — hides ALL assessment content.
// Cannot be dismissed without clicking the button (which triggers real user-gesture fullscreen).
// No ESC, no clicking outside, no seeing behind it.
const FullscreenPrompt = ({ onRequestFullscreen, violationCount, maxViolations }) => {
  const remaining = Math.max(0, maxViolations - violationCount);
  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ backgroundColor: '#0f172a', pointerEvents: 'all' }}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Blurred background blobs for visual depth — assessment content is fully hidden */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Red warning bar at top */}
        <div className="bg-red-600 rounded-t-2xl px-6 py-4 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-white shrink-0" />
          <div>
            <p className="text-white font-black text-[15px]">⚠ Proctoring Violation Detected</p>
            <p className="text-red-200 text-[12px] font-medium">This incident has been recorded and reported</p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-b-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Maximize className="w-10 h-10 text-red-600" />
          </div>

          <h3 className="font-black text-[20px] text-gray-900 mb-2">You Exited Fullscreen</h3>
          <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
            This assessment <strong className="text-gray-800">must run in fullscreen at all times</strong>.
            Exiting fullscreen is a proctoring violation. You cannot continue until you return to fullscreen.
          </p>

          {/* Violation counter */}
          <div className={`rounded-xl px-5 py-3 mb-5 border-2 ${
            remaining <= 1 ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'
          }`}>
            <p className={`text-[13px] font-black ${remaining <= 1 ? 'text-red-700' : 'text-amber-700'}`}>
              Violation #{violationCount} of {maxViolations}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              {Array.from({ length: maxViolations }).map((_, i) => (
                <span
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i < violationCount
                      ? 'bg-red-500 border-red-600'
                      : 'bg-gray-100 border-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className={`text-[12px] font-bold mt-2 ${remaining <= 1 ? 'text-red-600' : 'text-amber-600'}`}>
              {remaining <= 0
                ? '⚠ Assessment will be auto-submitted!'
                : `${remaining} more violation${remaining !== 1 ? 's' : ''} will auto-submit your assessment`}
            </p>
          </div>

          {/* The ONLY way out — clicking this button is a real user gesture so requestFullscreen works */}
          <button
            onClick={onRequestFullscreen}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[15px] shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Maximize className="w-5 h-5" /> Return to Fullscreen to Continue
          </button>

          <p className="text-[11px] text-gray-400 mt-3 font-medium">
            Assessment content is hidden until you return to fullscreen
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Auto-Submit Blocked Overlay ───────────────────────────────────
const BlockedOverlay = () => (
  <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <Lock className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="font-bold text-[20px] text-gray-900 mb-2">Assessment Terminated</h3>
      <p className="text-[13px] text-gray-500 leading-relaxed">
        Multiple proctoring violations were detected. Your assessment has been automatically submitted and flagged for review by your instructor.
      </p>
      <div className="mt-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <p className="text-[12px] font-bold text-red-700">
          All violation events have been recorded and sent to your institution.
        </p>
      </div>
    </div>
  </div>
);

// ── Camera Violation Modal ────────────────────────────────────────
const CameraViolationModal = ({ violationCount, max, onDismiss }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9997] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center">
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="font-bold text-[18px] text-gray-900 mb-2">Camera Violation Detected</h3>
      <p className="text-[13px] text-gray-500 mb-4 leading-relaxed">
        A camera proctoring violation has been recorded. Ensure your face is clearly visible and no other devices are in frame.
      </p>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
        <p className="text-[12px] font-bold text-red-600">
          Violation #{violationCount} of {max} — {max - violationCount} remaining before auto-submit.
        </p>
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: max }).map((_, i) => (
            <span key={i} className={`w-3 h-3 rounded-full border ${i < violationCount ? 'bg-red-500 border-red-600' : 'bg-gray-100 border-gray-300'}`} />
          ))}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-[14px] hover:bg-blue-700 shadow-sm transition-colors"
      >
        I Understand — Continue Assessment
      </button>
    </div>
  </div>
);

// ── Proctoring Status Badge ───────────────────────────────────────
const ProctoringBadge = ({ warningCount, max, camViolationCount, camMax }) => {
  const safe     = warningCount === 0 && camViolationCount === 0;
  const critical = warningCount >= max || camViolationCount >= camMax;
  return (
    <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border
      ${safe     ? 'bg-green-50 text-green-700 border-green-200'
      : critical ? 'bg-red-50 text-red-700 border-red-200'
                 : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
      {safe ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
      {safe ? 'Secured' : (
        <span className="flex items-center gap-1.5">
          <span title="Browser violations">🖥 {warningCount}/{max}</span>
          <span className="opacity-40">·</span>
          <span title="Camera violations">📷 {camViolationCount}/{camMax}</span>
        </span>
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  // ── Core state ────────────────────────────────────────────────
  // FIX 1: Start as 'loading' (not 'briefing') so briefing only renders
  // after API data is fully loaded — prevents empty/flickering values.
  const [phase, setPhase]                               = useState('loading');
  const [briefingInfo, setBriefingInfo]                 = useState(null);
  const [questions, setQuestions]                       = useState([]);
  const [currentIdx, setCurrentIdx]                     = useState(0);
  const [answers, setAnswers]                           = useState({});
  const [statuses, setStatuses]                         = useState({});
  const [flagged, setFlagged]                           = useState({});
  const [isDesktop, setIsDesktop]                       = useState(window.innerWidth >= 1024);
  const [error, setError]                               = useState('');
  const [submitConfirm, setSubmitConfirm]               = useState(false);
  const [fetchProgress, setFetchProgress]               = useState({ loaded: 0, total: 0 });
  const [submissionId, setSubmissionId]                 = useState(null);

  // ── Proctoring state ──────────────────────────────────────────
  const [showWarningToast, setShowWarningToast]           = useState(false);
  const [cameraLastViolation, setCameraLastViolation]     = useState(null);
  const [camViolationCount, setCamViolationCount]         = useState(0);
  const [showCamViolationModal, setShowCamViolationModal] = useState(false);
  const [cameraPermStatus, setCameraPermStatus]           = useState('idle');
  const CAM_MAX_VIOLATIONS = Number(import.meta.env.VITE_PROCTORING_MAX_CAMERA_VIOLATIONS) || 5;
  const PROCTORING_ENABLED = import.meta.env.VITE_PROCTORING_ENABLED !== 'false';

  // ── Direct fullscreen tracker — ground truth from browser API ──
  // This is used for the overlay condition instead of guard.isFullscreen
  // because guard.isFullscreen can desync. document.fullscreenElement never lies.
  const [isPageFullscreen, setIsPageFullscreen] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsPageFullscreen(inFs);
    };
    document.addEventListener('fullscreenchange',       onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange',    onFsChange);
    document.addEventListener('MSFullscreenChange',     onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange',       onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange',    onFsChange);
      document.removeEventListener('MSFullscreenChange',     onFsChange);
    };
  }, []);
  const togglePageFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  // ── Refs ──────────────────────────────────────────────────────
  const proctoringActive     = phase === 'in_progress' && PROCTORING_ENABLED;
  const autoSubmitRef        = useRef(null);
  const cameraInitializedRef = useRef(false);
  const questionScrollRef    = useRef(null);

  // ── Proctoring hooks ──────────────────────────────────────────
  const guard = useProctoringGuard({
    submissionId,
    onAutoSubmit: (reason) => autoSubmitRef.current?.(reason),
    enabled: proctoringActive,
  });

  const camera = useCameraProctoring({
    submissionId,
    enabled: PROCTORING_ENABLED,
    debugMode: false,

    // BUG 3 FIX: onViolation fires for ALL events (including WARNINGs).
    // Only show the toast for actual VIOLATION-severity events, not soft warnings.
    // Soft warnings (NO_FACE_WARNING) are handled exclusively by CameraOverlay's
    // own WarningToast — showing them here too causes a double-toast.
    onViolation: (event) => {
      if (event.severity === 'WARNING') return; // handled by onWarning below
      setCameraLastViolation(event);
      setShowWarningToast(true);
      const t = setTimeout(() => setShowWarningToast(false), 5000);
      return () => clearTimeout(t);
    },

    // BUG 1 FIX: useCameraProctoring only calls onCriticalViolation for
    // NO_FACE_DETECTED, CAMERA_DARK, CAMERA_COVERED, MOBILE_DETECTED — but
    // MULTIPLE_FACES is also CRITICAL severity and must count toward auto-submit.
    // We handle it here by checking event.severity === 'CRITICAL' instead of
    // relying on the hook's hardcoded list.
    //
    // BUG 2 + BUG 4 FIX: Feed every camera critical event into guard via
    // guard.recordCriticalFromCamera(event) so the shared warning counter and
    // risk score in useProctoringGuard are updated. Without this, camera
    // violations and browser violations are tracked in separate silos and the
    // guard's auto-submit threshold doesn't account for camera violations at all.
    onCriticalViolation: (event) => {
      // Bridge to guard's shared counter (risk score + auto-submit)
      guard.recordCriticalFromCamera?.(event);

      setCamViolationCount(prev => {
        const next = prev + 1;
        setShowCamViolationModal(true);
        if (next >= CAM_MAX_VIOLATIONS) autoSubmitRef.current?.('camera_proctoring_violation');
        return next;
      });
    },

    // BUG 3 FIX continued: onWarning handles soft warnings only.
    // NO_FACE_WARNING is handled by CameraOverlay's WarningToast internally —
    // don't show the TakeAssessment toast for it (double-toast).
    onWarning: (event) => {
      setCameraLastViolation(event);
      if (event.type !== 'NO_FACE_WARNING') {
        setShowWarningToast(true);
        const t = setTimeout(() => setShowWarningToast(false), 4000);
        return () => clearTimeout(t);
      }
    },
  });

  // ── FIX 2: Auto fullscreen + camera start after in_progress renders ─
  // CRITICAL: Must run AFTER React commits the phase='in_progress' render
  // so that CameraOverlay has mounted and videoRef.current is valid.
  // Also surfaces camera errors to the user instead of silently swallowing them.
  useEffect(() => {
    if (phase === 'in_progress' && PROCTORING_ENABLED && !cameraInitializedRef.current) {
      cameraInitializedRef.current = true;

      camera.startCamera()
        .then(() => {
          // Auto-enter fullscreen immediately when assessment begins
          return guard.requestFullscreen();
        })
        .catch(err => {
          if (import.meta.env.DEV) console.error('[TakeAssessment] Camera/fullscreen start error:', err);
          // FIX 4: Surface camera failure to user so they know proctoring didn't start
          setError('Camera could not be started. Please check your camera and reload. Proctoring may not be active.');
        });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show toast on new browser-behaviour violation ─────────────
  useEffect(() => {
    if (guard.lastViolation) {
      setCameraLastViolation(null);
      setShowWarningToast(true);
      const t = setTimeout(() => setShowWarningToast(false), 4000);
      return () => clearTimeout(t);
    }
  }, [guard.lastViolation]);

  // ── Scroll to top on question change ─────────────────────────
  useEffect(() => {
    if (questionScrollRef.current) questionScrollRef.current.scrollTop = 0;
  }, [currentIdx]);

  // ── FIX 1 continued: Initial data fetch — sets phase to 'briefing'
  // only AFTER data has loaded, never before. Also handles existing attempts.
  useEffect(() => {
    assessmentAttemptAPI.getMyAttempts(assessmentId)
      .then(res => {
        if (res.success && res.attempts?.some(a => a.status === 'submitted'))
          navigate('/dashboard/student/assessments/history', { replace: true });
      })
      .catch(() => {});

    assessmentAPI.getAssessmentDetails(assessmentId)
      .then(res => {
        if (res.success) {
          setBriefingInfo(res.assessment);
          setPhase('briefing'); // Only transition to briefing after data is ready
        } else {
          setError(res.message || 'Failed to load assessment details.');
          // Stay on loading phase so error screen shows
        }
      })
      .catch(e => {
        setError(e.message || 'Failed to load assessment details.');
        // Stay on loading phase so error screen shows
      });

    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [assessmentId]);

  // ── Begin assessment ──────────────────────────────────────────
  const handleBegin = async () => {
    if (PROCTORING_ENABLED && cameraPermStatus !== 'granted') {
      setError('Please allow camera access before starting the assessment.');
      return;
    }
    setPhase('loading');
    setError('');
    try {
      const startRes = await assessmentAPI.startAssessment(assessmentId);
      if (!startRes.success) throw new Error(startRes.message || 'Failed to start');
      const { attempt_id, total_questions } = startRes;
      if (!total_questions) throw new Error('This assessment has no questions yet.');

      setSubmissionId(attempt_id);
      setPhase('fetching');
      setFetchProgress({ loaded: 0, total: total_questions });

      const qs = (await Promise.all(
        Array.from({ length: total_questions }, (_, i) =>
          assessmentAPI.getQuestion(attempt_id, i + 1)
            .then(res => { setFetchProgress(p => ({ ...p, loaded: p.loaded + 1 })); return res.success ? res.question : null; })
            .catch(() => null)
        )
      )).filter(Boolean);

      if (!qs.length) throw new Error('Failed to load questions.');
      setQuestions(qs);
      const init = {};
      qs.forEach(q => { init[q.question_id] = 'unanswered'; });
      setStatuses(init);

      // FIX 2: Transition to in_progress — the useEffect above will fire
      // AFTER this render commits, ensuring videoRef.current is valid before
      // camera.startCamera() and guard.requestFullscreen() are called.
      setPhase('in_progress');
    } catch (e) {
      setError(e.message);
      setPhase('briefing');
    }
  };

  // ── Answer helpers ────────────────────────────────────────────
  const setAnswer = (qid, val) => {
    setAnswers(p => ({ ...p, [qid]: val }));
    setStatuses(p => ({ ...p, [qid]: flagged[qid] ? 'flagged' : 'answered' }));
  };

  const toggleFlag = (qid) => {
    const now = !flagged[qid];
    setFlagged(p => ({ ...p, [qid]: now }));
    setStatuses(p => ({ ...p, [qid]: now ? 'flagged' : answers[qid] != null ? 'answered' : 'unanswered' }));
  };

  const handleSkip = (qid) => {
    if (answers[qid] == null) setStatuses(p => ({ ...p, [qid]: 'skipped' }));
    setCurrentIdx(i => Math.min(i + 1, questions.length - 1));
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (reason = 'manual') => {
    setSubmitConfirm(false);
    setPhase('submitting');
    // Exit fullscreen and stop camera on submit
    guard.exitFullscreen?.();
    camera.stopCamera?.();
    try {
      const res = await assessmentAttemptAPI.submitAssessment(assessmentId,
        questions.map(q => ({ question_id: q.question_id, selected_answer: answers[q.question_id] ?? null }))
      );
      if (!res.success) throw new Error(res.message);
      setPhase('done');
    } catch (e) {
      setError(e.message);
      setPhase('in_progress');
    }
  }, [assessmentId, questions, answers, guard, camera]);

  useEffect(() => { autoSubmitRef.current = handleSubmit; }, [handleSubmit]);

  const handleTimerExpire = useCallback(() => {
    if (phase === 'in_progress') handleSubmit('timer_expired');
  }, [phase, handleSubmit]);

  const getStatus = (q) => statuses[q.question_id] || 'unanswered';

  // FIX 5: Safe destructure — guard.isOnline may be undefined if hook doesn't return it
  const isOnline = guard.isOnline ?? true;

  // ══════════════════════════════════════════════════════════════
  // ── Desktop Gate ─────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  if (!isDesktop) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] z-[9999] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 backdrop-blur-sm shadow-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
              <AlertTriangle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-white text-3xl font-black mb-4 tracking-tight">Desktop Access Required</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-8" />
          <p className="text-slate-400 max-w-md text-[15px] leading-relaxed mb-10 font-medium">
            Skill assessments can only be attended on a
            <span className="text-blue-400 font-bold"> desktop or laptop device</span>.
            Mobile and tablet access is restricted.
          </p>
          <button
            onClick={() => navigate('/dashboard/student/assessments')}
            className="group px-8 py-4 bg-white text-[#0f172a] rounded-2xl font-extrabold hover:bg-blue-50 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-3 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back to Assessments
          </button>
          <p className="mt-12 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Controlled Testing Environment</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── Loading / Fetching / Submitting phases ────────────────────
  // ══════════════════════════════════════════════════════════════
  if (phase === 'loading') {
    // Show error screen if API failed during initial briefing load
    if (error) {
      return (
        <div className="h-screen w-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-[16px] font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-[13px] text-gray-500 mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold">
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return <FullLoader title="Loading Assessment" sub="Fetching assessment details..." />;
  }

  if (phase === 'fetching') {
    const pct = fetchProgress.total > 0 ? Math.round((fetchProgress.loaded / fetchProgress.total) * 100) : 0;
    return <FullLoader title="Loading Questions" sub={`Fetching ${fetchProgress.loaded} of ${fetchProgress.total}`} pct={pct} />;
  }

  if (phase === 'submitting') return <FullLoader title="Submitting Assessment" sub="Please do not close this tab or window." />;

  // ══════════════════════════════════════════════════════════════
  // ── Briefing — Two-column layout (Doc 1) + Camera perm (Doc 2)
  // ══════════════════════════════════════════════════════════════
  if (phase === 'briefing') {
    const skill    = briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Skill Assessment';
    const levelStr = briefingInfo?.level || 'Beginner';
    const levelCfg = LEVEL_CONFIG[levelStr] || LEVEL_CONFIG.Beginner;
    const duration = briefingInfo?.duration_minutes;
    const totalQ   = briefingInfo?.questions_id?.length || briefingInfo?.total_questions || 0;

    return (
      <div className="min-h-screen bg-[#F8F9fa] font-sans text-gray-800" style={{ fontFamily: "'Inter', 'IBM Plex Sans', sans-serif" }}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[16px] font-bold text-gray-900 truncate max-w-[300px]">{skill}</h1>
            <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border ${levelCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${levelCfg.dot}`} />
              {levelCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 shrink-0">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Secured</span>
          </div>
        </header>

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* ── Left Column: Instructions ── */}
            <div className="flex-1 w-full bg-white p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-[22px] font-bold text-gray-900 mb-6">Instructions</h2>

              {error && (
                <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-[13px] text-red-700 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <div className="space-y-8">

                {/* ── Camera Permission — proctoring ON only ── */}
                {PROCTORING_ENABLED && (
                  <section>
                    <div className={`rounded-xl p-4 border transition-all ${
                      cameraPermStatus === 'granted'
                        ? 'bg-green-50 border-green-200'
                        : cameraPermStatus === 'denied' || cameraPermStatus === 'error'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {cameraPermStatus === 'granted'
                          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                          : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        <h4 className={`text-[13px] font-bold ${
                          cameraPermStatus === 'granted' ? 'text-green-800'
                          : cameraPermStatus === 'denied' || cameraPermStatus === 'error' ? 'text-red-800'
                          : 'text-amber-800'
                        }`}>Step 1 — Camera Access Required</h4>
                      </div>
                      {cameraPermStatus === 'granted' ? (
                        <p className="text-[12px] text-green-700 font-medium">✓ Camera permission granted. You are ready to begin.</p>
                      ) : cameraPermStatus === 'denied' ? (
                        <div>
                          <p className="text-[12px] text-red-700 font-medium mb-1">Camera access was denied. Allow camera access in your browser settings and reload this page.</p>
                          <p className="text-[11px] text-red-600">Click the camera icon in your address bar → Allow → Reload.</p>
                        </div>
                      ) : cameraPermStatus === 'error' ? (
                        <div>
                          <p className="text-[12px] text-red-700 font-medium mb-1">Camera error. Another app (e.g. Teams) may be blocking it.</p>
                          <button
                            onClick={async () => {
                              setCameraPermStatus('requesting');
                              const r = await camera.requestPermission?.();
                              setCameraPermStatus(r === 'granted' ? 'granted' : r ?? 'error');
                            }}
                            className="mt-2 px-3 py-1.5 bg-red-600 text-white text-[12px] font-bold rounded-lg hover:bg-red-700 transition-colors"
                          >Retry Camera Access</button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[12px] text-amber-700 font-medium mb-3">
                            Allow camera access <strong>before</strong> starting — this prevents the browser permission dialog from appearing during the fullscreen exam (which would count as a violation).
                          </p>
                          <button
                            disabled={cameraPermStatus === 'requesting'}
                            onClick={async () => {
                              setCameraPermStatus('requesting');
                              const r = await camera.requestPermission?.();
                              setCameraPermStatus(r === 'granted' ? 'granted' : r ?? 'error');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-[13px] font-bold rounded-xl hover:bg-amber-700 disabled:opacity-60 transition-colors"
                          >
                            {cameraPermStatus === 'requesting'
                              ? <><Loader2 className="w-4 h-4 animate-spin" /> Requesting…</>
                              : <><Shield className="w-4 h-4" /> Allow Camera Access</>}
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ── Dev mode banner ── */}
                {!PROCTORING_ENABLED && (
                  <section>
                    <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <h4 className="text-[13px] font-bold text-yellow-800">Development Mode — Proctoring Disabled</h4>
                      </div>
                      <p className="text-[12px] text-yellow-700 font-medium">
                        Camera, fullscreen lock, and tab monitoring are <strong>OFF</strong>.
                        Set <code className="bg-yellow-100 px-1 rounded">VITE_PROCTORING_ENABLED=true</code> in{' '}
                        <code className="bg-yellow-100 px-1 rounded">.env.production</code> before deploying.
                      </p>
                    </div>
                  </section>
                )}

                {/* ── Timing & Navigation ── */}
                <section>
                  <h3 className="text-[13px] font-bold text-blue-800 bg-blue-50 px-3 py-1.5 inline-flex items-center gap-2 rounded-lg mb-4">
                    <Clock className="w-4 h-4" /> TIMING & NAVIGATION
                  </h3>
                  <ul className="text-[14px] text-gray-600 space-y-3">
                    {[
                      `The assessment duration is <strong class="text-gray-900">${duration || 60} minutes</strong>.`,
                      'The timer starts the moment you click "Begin Assessment" and <strong class="text-gray-900">cannot be paused</strong>.',
                      'You can navigate freely between questions using the Question Palette on the left sidebar.',
                      'Answers are continuously saved automatically.',
                      'The assessment will auto-submit when the time expires.',
                    ].map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <div dangerouslySetInnerHTML={{ __html: t }} />
                      </li>
                    ))}
                  </ul>
                </section>

                {/* ── Proctoring & Integrity ── */}
                <section>
                  <h3 className="text-[13px] font-bold text-blue-800 bg-blue-50 px-3 py-1.5 inline-flex items-center gap-2 rounded-lg mb-4">
                    <Shield className="w-4 h-4" /> PROCTORING & INTEGRITY
                  </h3>
                  <ul className="text-[14px] text-gray-600 space-y-3">
                    {[
                      'Ensure you are in a quiet, properly lit room with a stable internet connection.',
                      '<strong class="text-gray-900">Do not switch tabs or minimize the browser.</strong> Tab switching and focus loss are monitored and logged.',
                      '<strong class="text-gray-900">Copy, paste, right-click</strong> and browser shortcuts (F12, Ctrl+Shift+I) are disabled.',
                      'This assessment runs in <strong class="text-gray-900">locked fullscreen mode</strong>. Exiting fullscreen is a violation.',
                      'After <strong class="text-gray-900">5 critical violations</strong> the assessment will auto-submit and be flagged.',
                      '<strong class="text-gray-900">Your webcam will be activated</strong> for AI-powered face monitoring. No video is recorded — only violation events are logged.',
                    ].map((t, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <div dangerouslySetInnerHTML={{ __html: t }} />
                      </li>
                    ))}
                  </ul>
                </section>

                {/* ── Specific Guidelines (from admin) ── */}
                {briefingInfo?.instructions && (
                  <section>
                    <h3 className="text-[13px] font-bold text-blue-800 bg-blue-50 px-3 py-1.5 inline-flex items-center gap-2 rounded-lg mb-4">
                      <BookOpen className="w-4 h-4" /> SPECIFIC GUIDELINES
                    </h3>
                    <div className="text-[14px] text-gray-700 bg-gray-50/80 p-5 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                      {briefingInfo.instructions}
                    </div>
                  </section>
                )}
              </div>

              {/* Important Note */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mt-8 flex gap-4">
                <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-[14px] mb-1">Important Note</h4>
                  <p className="text-blue-800/80 text-[13px] leading-relaxed">
                    Make sure you have blocked out at least {duration || 60} minutes. Once started, you cannot pause the timer. Do not press F5 or the Back button during the test.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right Column: Summary Card ── */}
            <div className="w-full lg:w-[360px] shrink-0 sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Gradient header */}
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-[16px] leading-tight">{skill}</h3>
                      <span className="text-[12px] text-blue-100">Comprehensive Assessment</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Stats rows */}
                  <div className="space-y-0 divide-y divide-gray-100 mb-6">
                    {[
                      { icon: BookOpen,    label: 'Total Questions', value: totalQ || '-'              },
                      { icon: Clock,       label: 'Duration',        value: `${duration || 60} mins`   },
                      { icon: CheckCircle2,label: 'Pass Mark',       value: `${briefingInfo?.passing_score || 50}%` },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between py-3.5">
                        <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                          <Icon className="w-4 h-4 text-gray-400" /> {label}
                        </div>
                        <span className="font-bold text-gray-900 text-[14px]">{value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                        <Shield className="w-4 h-4 text-gray-400" /> Security
                      </div>
                      <span className="flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded border border-green-200 text-[10px] uppercase tracking-wider">
                        {PROCTORING_ENABLED ? 'Enabled' : 'Dev Mode'}
                      </span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleBegin}
                      disabled={PROCTORING_ENABLED && cameraPermStatus !== 'granted'}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all text-[14px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <Lock className="w-4 h-4" /> Begin Secured Assessment
                    </button>
                    <button
                      onClick={() => navigate(-1)}
                      className="w-full py-3 text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-[13px]"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-400 leading-relaxed font-medium">
                    <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-300" />
                    <p>By starting, you agree to the Academic Integrity Policy. Disciplinary actions apply to violations.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── Done ─────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  if (phase === 'done') {
    const answeredCount = Object.values(answers).filter(v => v != null && (!Array.isArray(v) || v.length > 0)).length;
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <Card className="p-0 overflow-hidden">
            <div className="py-12 px-8 bg-green-50 border-b border-green-100">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-[20px] font-bold text-gray-900 mb-2">Assessment Submitted!</h2>
              <p className="text-[14px] text-gray-500">
                You answered {answeredCount} of {questions.length} questions. Results will be available once published.
              </p>
              {(guard.violations?.length > 0 || camViolationCount > 0) && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                  {guard.violations?.length > 0 && (
                    <p className="text-[12px] font-bold text-amber-700">
                      🖥 {guard.violations.length} browser proctoring event{guard.violations.length !== 1 ? 's were' : ' was'} recorded.
                    </p>
                  )}
                  {camViolationCount > 0 && (
                    <p className="text-[12px] font-bold text-amber-700">
                      📷 {camViolationCount} camera violation{camViolationCount !== 1 ? 's were' : ' was'} recorded.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="p-8 flex gap-3">
              <button onClick={() => navigate('/dashboard/student/assessments/history')}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-[14px] hover:bg-gray-50 transition-colors">
                View History
              </button>
              <button onClick={() => navigate('/dashboard/student/assessments')}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-[14px] hover:bg-blue-700 transition-colors shadow-sm">
                Back to Assessments
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // ── In Progress — 3-column layout ────────────────────────────
  // ══════════════════════════════════════════════════════════════
  const q = questions[currentIdx];
  if (!q) return null;
  const total         = questions.length;
  const qid           = q.question_id;
  const questionText  = q.question_text || q.question || '(Question text unavailable)';
  const opts          = q.options || [];
  const answeredCount = Object.values(answers).filter(v => v != null && (!Array.isArray(v) || v.length > 0)).length;
  const progress      = ((currentIdx + 1) / total) * 100;
  const isCodingQ     = q.type === 'coding';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white" style={{ fontFamily: "'Inter', 'IBM Plex Sans', sans-serif", userSelect: 'none' }}>

      {/* ── Proctoring Overlays ── */}
      {guard.isBlocked && <BlockedOverlay />}

      {!guard.isBlocked && !isPageFullscreen && PROCTORING_ENABLED && phase === 'in_progress' && (
        <FullscreenPrompt
          onRequestFullscreen={guard.requestFullscreen}
          violationCount={guard.warningCount}
          maxViolations={guard.MAX_VIOLATIONS}
        />
      )}

      {!guard.isBlocked && showCamViolationModal && (
        <CameraViolationModal
          violationCount={camViolationCount}
          max={CAM_MAX_VIOLATIONS}
          onDismiss={() => setShowCamViolationModal(false)}
        />
      )}

      {showWarningToast && (guard.lastViolation || cameraLastViolation) && (
        <ProctoringWarningToast
          violation={guard.lastViolation || cameraLastViolation}
          remaining={guard.criticalViolationsRemaining}
          onDismiss={() => setShowWarningToast(false)}
        />
      )}

      {/* ── Camera PiP Overlay ── */}
      <CameraOverlay
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        overlayRef={camera.overlayRef}
        status={camera.status}
        faceStatus={camera.faceStatus}
        isActive={camera.isActive}
        violationCount={camera.violationCount}
        streak={camera.streak}
        brightness={camera.brightness}
        faceConfidence={camera.faceConfidence}
        lastEvent={camera.lastEvent}
        noFaceWarningCount={camera.noFaceWarningCount}
        noFaceWarningsRemaining={camera.noFaceWarningsRemaining}
        gazeStatus={camera.gazeStatus}
      />

      {/* ══════════════════════════════════════════════════════
          TOP NAV BAR
      ══════════════════════════════════════════════════════ */}
      <header className="flex flex-col shrink-0 border-b border-gray-200 bg-white shadow-sm" style={{ zIndex: 40 }}>
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div className="h-0.5 bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center justify-between px-5 gap-4" style={{ height: '52px' }}>
          {/* Left: title + meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-[14px] font-bold text-gray-900 truncate max-w-[240px] block leading-tight">
                {briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Assessment'}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                Question {currentIdx + 1} of {total}
                <span className="mx-1.5 text-gray-300">|</span>
                {answeredCount} Answered
              </span>
            </div>
          </div>

          {/* Right: badges + timer + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ProctoringBadge
              warningCount={guard.warningCount}
              max={guard.MAX_VIOLATIONS}
              camViolationCount={camViolationCount}
              camMax={CAM_MAX_VIOLATIONS}
            />

            {/* FIX 5: Safe isOnline check */}
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Offline
              </div>
            )}

            <Timer totalSeconds={(briefingInfo?.duration_minutes || 60) * 60} onExpire={handleTimerExpire} />

            <button
              onClick={() => setSubmitConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-md text-white text-[12px] font-bold transition-shadow"
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </button>

            {/* FIX 3: Manual fullscreen button — dev mode only (prod uses guard.requestFullscreen) */}
            {!PROCTORING_ENABLED && (
              <button
                onClick={togglePageFullscreen}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors border border-gray-200"
                title={isPageFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen assessment'}
              >
                {isPageFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Error bar */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-[12px] font-medium text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 text-[11px] font-bold">Dismiss</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MAIN 3-COLUMN BODY
      ══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR: Question Number Navigator ── */}
        <aside
          className="flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50"
          style={{ width: '56px' }}
        >
          {questions.map((sq, idx) => (
            <QuestionPill
              key={sq.question_id}
              number={idx + 1}
              status={getStatus(sq)}
              isCurrent={idx === currentIdx}
              onClick={() => setCurrentIdx(idx)}
            />
          ))}
          {/* Legend */}
          <div className="mt-auto pt-3 border-t border-gray-200 w-full flex flex-col items-center gap-2 pb-2">
            <div className="w-2 h-2 rounded-sm bg-blue-600"                         title="Current"    />
            <div className="w-2 h-2 rounded-sm bg-blue-100 border border-blue-300"  title="Answered"   />
            <div className="w-2 h-2 rounded-sm bg-white border border-gray-300"     title="Unanswered" />
            <div className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-400" title="Flagged"   />
            <div className="w-2 h-2 rounded-sm bg-orange-100 border border-orange-300" title="Skipped" />
          </div>
        </aside>

        {/* ── MIDDLE: Question Content (scrollable) ── */}
        <main ref={questionScrollRef} className="flex-1 overflow-y-auto min-h-0 bg-white">
          <div className="max-w-[680px] mx-auto px-6 py-5 pb-16">

            {/* Question header */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Q{currentIdx + 1}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {q.marks ?? 1} Mark{(q.marks ?? 1) !== 1 ? 's' : ''}
                    </span>
                    {q.type === 'multiple_answer' && (
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                        Multiple Choice
                      </span>
                    )}
                    {flagged[qid] && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                        <Flag className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </div>
                  <h1 className="text-[20px] font-bold text-gray-900 leading-snug">{questionText}</h1>
                </div>
                <button
                  onClick={() => toggleFlag(qid)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors shrink-0 ${
                    flagged[qid] ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" /> {flagged[qid] ? 'Flagged' : 'Flag'}
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {isCodingQ && <TagChip label="Coding Question" />}
                {q.algorithm_tags?.map(t => <TagChip key={t} label={t} />)}
              </div>
            </div>

            {/* ── Coding Question Details ── */}
            {isCodingQ && (
              <>
                {q.problem_description && (
                  <section className="mb-5">
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Problem Description</span>
                      </div>
                      <div className="p-4">
                        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{q.problem_description}</p>
                      </div>
                    </div>
                  </section>
                )}

                {(q.input_format || q.output_format) && (
                  <section className="mb-5 grid grid-cols-2 gap-3">
                    {q.input_format && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Input Format</span>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">{q.input_format}</p>
                        </div>
                      </div>
                    )}
                    {q.output_format && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Output Format</span>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">{q.output_format}</p>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {q.constraints && (
                  <section className="mb-5">
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Constraints</span>
                        <div className="flex items-center gap-2">
                          {q.time_complexity  && <ComplexityBadge label="Time"  value={q.time_complexity} />}
                          {q.space_complexity && <ComplexityBadge label="Space" value={q.space_complexity} />}
                        </div>
                      </div>
                      <div className="p-4">
                        <pre className="text-[12px] font-mono text-gray-600 whitespace-pre-wrap">{q.constraints}</pre>
                      </div>
                    </div>
                  </section>
                )}

                {q.test_cases?.filter(tc => !tc.is_hidden).length > 0 && (
                  <section className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[12px] font-bold text-gray-900">Sample Test Cases</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                        {q.test_cases.filter(tc => !tc.is_hidden).length} cases
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {q.test_cases.filter(tc => !tc.is_hidden).map((tc, i) => (
                        <SampleCase key={i} index={i + 1} input={tc.input} output={tc.expected_output} explanation={tc.explanation} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Hint: code editor is on the right */}
                <div className="text-[12px] text-gray-400 font-medium italic flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                  Write your solution in the code editor on the right →
                </div>
              </>
            )}

            {/* ── MCQ Options ── */}
            {(q.type === 'single_answer' || q.type === 'multiple_answer') && opts.length > 0 && (
              <div className="space-y-3 mb-5">
                {opts.map((opt, oIdx) => {
                  const sel = q.type === 'multiple_answer'
                    ? (Array.isArray(answers[qid]) && answers[qid].includes(opt.label))
                    : answers[qid] === opt.label;

                  const click = () => {
                    if (q.type === 'multiple_answer') {
                      const cur  = Array.isArray(answers[qid]) ? answers[qid] : [];
                      const next = sel ? cur.filter(l => l !== opt.label) : [...cur, opt.label];
                      setAnswers(p  => ({ ...p, [qid]: next.length ? next : null }));
                      setStatuses(p => ({ ...p, [qid]: flagged[qid] ? 'flagged' : next.length ? 'answered' : 'unanswered' }));
                    } else {
                      setAnswer(qid, opt.label);
                    }
                  };

                  return (
                    <button key={opt.label} onClick={click}
                      className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all
                        ${sel ? 'border-blue-500 bg-blue-50/40 shadow-[0_2px_8px_rgba(59,130,246,0.1)]'
                              : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors
                        ${sel ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className={`font-medium text-[15px] flex-1 ${sel ? 'text-blue-900' : 'text-gray-700'}`}>{opt.text}</span>
                      {sel && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {q.type === 'multiple_answer' && (
                  <p className="text-[12px] font-medium text-gray-500 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Select all applicable options.
                  </p>
                )}
              </div>
            )}

            {/* ── Fill-up ── */}
            {q.type === 'fill_up' && (
              <div className="mb-5">
                <input type="text"
                  value={typeof answers[qid] === 'string' ? answers[qid] : ''}
                  onChange={e => setAnswer(qid, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-[15px] font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all bg-gray-50 focus:bg-white"
                  autoComplete="off" spellCheck="false"
                />
              </div>
            )}

            {/* ── Bottom navigation ── */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSkip(qid)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-500 hover:border-gray-400 transition-colors bg-white shadow-sm">
                  Skip <SkipForward className="w-3 h-3" />
                </button>
                {currentIdx < total - 1 ? (
                  <button onClick={() => setCurrentIdx(i => Math.min(i + 1, total - 1))}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => setSubmitConfirm(true)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-green-600 text-white text-[12px] font-bold hover:bg-green-700 transition-colors shadow-sm shadow-green-200">
                    Submit <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT PANEL: Code Editor (coding) OR Question Palette (non-coding) ── */}
        {isCodingQ ? (
          <aside
            className="flex flex-col shrink-0 border-l border-gray-200 overflow-hidden bg-gray-50"
            style={{ width: '50%', minWidth: '480px', maxWidth: '800px' }}
          >
            <div className="flex-1 min-h-0 overflow-hidden p-3">
              <CodeEditor
                key={qid}
                assessmentId={assessmentId}
                questionId={qid}
                questionText={q.question}
                marks={q.marks}
                boilerplateCode={q.boilerplate_code || q.starter_code}
                defaultLanguage={briefingInfo?.default_coding_language || 'python'}
                onCodeSubmitted={({ passedCount, totalCount }) => {
                  setAnswer(qid, `[Code submitted: ${passedCount}/${totalCount} tests passed]`);
                }}
              />
            </div>
          </aside>
        ) : (
          <aside className="hidden lg:flex flex-col bg-white border-l border-gray-200 shadow-[0_0_15px_rgba(0,0,0,0.03)] shrink-0 overflow-hidden" style={{ width: '280px' }}>
            <div className="w-[280px] flex flex-col h-full overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-[13px] text-gray-900 mb-0.5 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-500" /> Question Palette
                </h3>
                <p className="text-[12px] font-medium text-gray-500">{answeredCount} of {total} Answered</p>
              </div>

              {/* Legend counts */}
              <div className="px-4 py-3 grid grid-cols-2 gap-2 border-b border-gray-100 bg-white text-[11px] font-medium">
                {[
                  { label: 'Answered', s: 'answered',   bg: 'bg-blue-600',   text: 'text-white',      border: 'border-transparent' },
                  { label: 'Skipped',  s: 'skipped',    bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200'  },
                  { label: 'Flagged',  s: 'flagged',    bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200'   },
                  { label: 'Pending',  s: 'unanswered', bg: 'bg-white',      text: 'text-gray-600',   border: 'border-gray-200'    },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold border ${l.bg} ${l.text} ${l.border}`}>
                      {Object.values(statuses).filter(s => s === l.s).length}
                    </span>
                    <span className="text-gray-600">{l.label}</span>
                  </div>
                ))}
              </div>

              {/* Question grid */}
              <div className="p-4 flex-1 overflow-y-auto bg-gray-50/30">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((sq, idx) => {
                    const st = statuses[sq.question_id] || 'unanswered';
                    let styleClass = '';
                    if      (st === 'answered') styleClass = 'bg-blue-600 text-white border-transparent';
                    else if (st === 'skipped')  styleClass = 'bg-orange-50 text-orange-500 border-orange-200';
                    else if (st === 'flagged')  styleClass = 'bg-amber-50 text-amber-600 border-amber-300';
                    else                        styleClass = 'bg-white text-gray-400 border-gray-200 hover:border-gray-400';

                    return (
                      <button key={sq.question_id} onClick={() => setCurrentIdx(idx)}
                        className={`w-9 h-9 rounded-lg text-[12px] font-bold border transition-all flex items-center justify-center
                          ${currentIdx === idx ? 'ring-2 ring-blue-600 ring-offset-1 scale-110' : 'hover:scale-105'}
                          ${styleClass}`}>
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Proctoring alerts in palette */}
              {(guard.warningCount > 0 || camViolationCount > 0) && (
                <div className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">Proctoring Alerts</p>
                  </div>
                  {guard.warningCount > 0 && (
                    <p className="text-[11px] text-amber-700">🖥 {guard.warningCount} browser violation{guard.warningCount !== 1 ? 's' : ''} ({guard.criticalViolationsRemaining} remaining).</p>
                  )}
                  {camViolationCount > 0 && (
                    <p className="text-[11px] text-amber-700 mt-0.5">📷 {camViolationCount} camera violation{camViolationCount !== 1 ? 's' : ''} ({CAM_MAX_VIOLATIONS - camViolationCount} remaining).</p>
                  )}
                </div>
              )}

              <div className="p-4 border-t border-gray-200 bg-white">
                <button
                  onClick={() => setSubmitConfirm(true)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Send className="w-4 h-4" /> Submit Assessment
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-[18px] text-gray-900 mb-2">Submit Assessment?</h3>
            <p className="text-[14px] text-gray-500 mb-3">
              You've answered <strong className="text-gray-900">{answeredCount}</strong> out of <strong className="text-gray-900">{total}</strong> questions.
            </p>
            {total - answeredCount > 0 && (
              <div className="bg-red-50 text-red-600 font-medium text-[12px] py-2 px-3 rounded-lg mb-3 border border-red-100">
                {total - answeredCount} unanswered question{total - answeredCount !== 1 ? 's' : ''} will be marked incorrect.
              </div>
            )}
            {guard.warningCount > 0 && (
              <div className="bg-amber-50 text-amber-700 font-medium text-[12px] py-2 px-3 rounded-lg mb-2 border border-amber-200">
                🖥 {guard.warningCount} browser violation{guard.warningCount !== 1 ? 's' : ''} will be included in your report.
              </div>
            )}
            {camViolationCount > 0 && (
              <div className="bg-amber-50 text-amber-700 font-medium text-[12px] py-2 px-3 rounded-lg mb-3 border border-amber-200">
                📷 {camViolationCount} camera violation{camViolationCount !== 1 ? 's' : ''} will be included in your report.
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSubmitConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-[13px] transition-colors">
                Return
              </button>
              <button onClick={() => handleSubmit('manual')}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 shadow-sm transition-colors">
                Confirm Submit
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TakeAssessment;