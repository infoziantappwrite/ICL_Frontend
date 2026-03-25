/**
 * CameraOverlay.jsx  ▸  ENHANCED v4.0
 * ─────────────────────────────────────────────────────────────────────────────
 * All v3.0 root-cause fixes preserved (always-mounted offscreen video/canvas,
 * PipCanvas requestAnimationFrame painter, etc.)
 *
 * NEW in v4.0 — matches useCameraProctoring v3.0:
 *  ✦ 'covered'  face-status — camera blocked/hidden
 *  ✦ 'mobile'   face-status — secondary device detected
 *  ✦ 'gaze_left' / 'gaze_right' — eyeball tracking status badges
 *  ✦ No-face warning counter — shows "Warning 1/2" before a real violation
 *  ✦ Warning-only toast — distinct amber toast for soft warnings vs red for violations
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Camera, CameraOff, ChevronDown, ChevronUp,
  AlertTriangle, Loader2, Eye, EyeOff, Users,
  ShieldAlert, Sun, ZapOff, Scan, Image,
  Smartphone, EyeIcon, Lock,
} from 'lucide-react';

// ─── Face status config — extended for v4.0 ───────────────────────────────────
const FACE_STATUS_CONFIG = {
  ok          : { icon: Eye,           label: 'Face OK',              color: '#22c55e', ring: '#4ade80',  bg: 'bg-green-500' },
  no_face     : { icon: EyeOff,        label: 'No Face',              color: '#ef4444', ring: '#ef4444',  bg: 'bg-red-500',   pulse: true },
  multiple    : { icon: Users,         label: 'Multiple Faces',       color: '#ef4444', ring: '#ef4444',  bg: 'bg-red-500',   pulse: true },
  away        : { icon: AlertTriangle, label: 'Look at Screen',       color: '#f59e0b', ring: '#fbbf24',  bg: 'bg-amber-500', pulse: true },
  down        : { icon: AlertTriangle, label: 'Looking Down',         color: '#f59e0b', ring: '#fbbf24',  bg: 'bg-amber-500', pulse: true },
  eyes_closed : { icon: EyeOff,        label: 'Eyes Closed',          color: '#f59e0b', ring: '#fbbf24',  bg: 'bg-amber-500', pulse: true },
  too_small   : { icon: Scan,          label: 'Too Far / Covered',    color: '#ef4444', ring: '#ef4444',  bg: 'bg-red-500',   pulse: true },
  dark        : { icon: ZapOff,        label: 'Camera Dark',          color: '#ef4444', ring: '#dc2626',  bg: 'bg-red-600',   pulse: true },
  obscured    : { icon: Scan,          label: 'Face Obscured',        color: '#f97316', ring: '#fb923c',  bg: 'bg-orange-500',pulse: true },
  // v4.0 new
  covered     : { icon: Lock,          label: 'Camera Covered!',      color: '#dc2626', ring: '#dc2626',  bg: 'bg-red-700',   pulse: true },
  mobile      : { icon: Smartphone,    label: 'Device Detected!',     color: '#7c3aed', ring: '#8b5cf6',  bg: 'bg-violet-600',pulse: true },
  gaze_left   : { icon: EyeIcon,       label: 'Eyes Looking Left',    color: '#f59e0b', ring: '#fbbf24',  bg: 'bg-amber-500', pulse: true },
  gaze_right  : { icon: EyeIcon,       label: 'Eyes Looking Right',   color: '#f59e0b', ring: '#fbbf24',  bg: 'bg-amber-500', pulse: true },
};

const getThreatLevel = (faceStatus, violationCount, streak) => {
  if (['dark','no_face','covered','mobile'].includes(faceStatus) || streak >= 3)
    return { level: 'CRITICAL', color: '#ef4444', label: 'Critical' };
  if (['multiple','too_small'].includes(faceStatus) || violationCount >= 5)
    return { level: 'HIGH',     color: '#f97316', label: 'High'     };
  if (faceStatus !== 'ok' || violationCount >= 2)
    return { level: 'MEDIUM',   color: '#f59e0b', label: 'Medium'   };
  return   { level: 'LOW',      color: '#22c55e', label: 'Low'      };
};

const THREAT_COLOURS = {
  LOW      : 'bg-green-500',
  MEDIUM   : 'bg-amber-500',
  HIGH     : 'bg-orange-500',
  CRITICAL : 'bg-red-500',
};

// ─── PipCanvas ────────────────────────────────────────────────────────────────
const PipCanvas = ({ videoRef, width = 160, height = 120 }) => {
  const pipRef = useRef(null);
  const rafRef = useRef(null);
  useEffect(() => {
    const draw = () => {
      const video=videoRef.current, canvas=pipRef.current;
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        ctx.save(); ctx.translate(width,0); ctx.scale(-1,1);
        ctx.drawImage(video,0,0,width,height);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef, width, height]);
  return <canvas ref={pipRef} width={width} height={height} className="w-full h-full" />;
};

// ─── Snapshot Modal ────────────────────────────────────────────────────────────
const SnapshotModal = ({ snapshot, label, onClose }) => {
  if (!snapshot) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <p className="text-[12px] font-bold text-gray-800">Violation Snapshot</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-[18px] leading-none">×</button>
        </div>
        <img src={snapshot} alt="Violation frame" className="w-full rounded-lg border border-gray-200" />
        <p className="mt-2 text-[11px] text-center text-gray-500">{label}</p>
      </div>
    </div>
  );
};

// ─── Collapsed badge ───────────────────────────────────────────────────────────
const CollapsedBadge = ({ faceStatus, violationCount }) => {
  if (faceStatus === 'ok') return null;
  const cfg = FACE_STATUS_CONFIG[faceStatus] || FACE_STATUS_CONFIG.ok;
  return (
    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-full px-2.5 py-1 shadow-sm">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <span className="text-[10px] font-bold text-red-600">{cfg.label}</span>
      {violationCount > 0 && (
        <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5">{violationCount}</span>
      )}
    </div>
  );
};

// ─── Transient status banner ───────────────────────────────────────────────────
const TransientBanner = ({ status }) => {
  const configs = {
    requesting    : { icon: <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />, title: 'Camera Access', sub: 'Allow camera in the popup...', border: 'border-gray-200' },
    loading_models: { icon: (<div className="relative shrink-0"><Camera className="w-5 h-5 text-blue-600" /><Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin absolute -bottom-1 -right-1" /></div>), title: 'Loading AI Models', sub: 'One-time setup (~540 KB)...', border: 'border-blue-100' },
    denied        : { icon: <CameraOff className="w-4 h-4 text-red-600 shrink-0" />, title: 'Camera Denied', sub: 'Camera blocked. Reload to retry.', border: 'border-red-200 bg-red-50' },
    model_error   : { icon: <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />, title: 'AI Models Missing', sub: 'Run: node scripts/download-models.js then restart.', border: 'border-red-200 bg-red-50' },
    error         : { icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />, title: 'Camera Error', sub: 'Camera issue. Other proctoring active.', border: 'border-amber-200 bg-amber-50' },
  };
  const cfg = configs[status];
  if (!cfg) return null;
  return (
    <div className={`fixed bottom-6 left-6 z-50 bg-white rounded-2xl shadow-xl border ${cfg.border} p-4 flex items-center gap-3 max-w-[230px]`}>
      {cfg.icon}
      <div>
        <p className="text-[12px] font-bold text-gray-800">{cfg.title}</p>
        <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{cfg.sub}</p>
      </div>
    </div>
  );
};

// ─── v4.0 Warning Toast — shown for soft no-face warnings ─────────────────────
const WarningToast = ({ warningNumber, warningsLeft }) => {
  if (!warningNumber) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9998] animate-bounce">
      <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 max-w-xs">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <p className="text-[13px] font-bold text-amber-800">Face Not Detected — Warning {warningNumber}</p>
          <p className="text-[11px] text-amber-600 leading-snug mt-0.5">
            {warningsLeft > 0
              ? `${warningsLeft} more warning${warningsLeft > 1 ? 's' : ''} before this is logged as a violation`
              : 'Next occurrence will be recorded as a violation'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Off-screen elements (always mounted) ─────────────────────────────────────
const OFFSCREEN = { position: 'fixed', left: '-9999px', top: '-9999px', width: 1, height: 1 };
const AlwaysMounted = ({ canvasRef, videoRef }) => (
  <>
    <canvas ref={canvasRef} width={320} height={240} style={OFFSCREEN} aria-hidden="true" />
    <video  ref={videoRef}  width={320} height={240} style={OFFSCREEN} muted playsInline aria-hidden="true" />
  </>
);

// ─── Gaze direction indicator ──────────────────────────────────────────────────
const GazeIndicator = ({ gazeStatus }) => {
  if (!gazeStatus || gazeStatus === 'center') return null;
  return (
    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-amber-500/90 rounded-full px-2 py-0.5 flex items-center gap-1">
      <EyeIcon className="w-2.5 h-2.5 text-white" />
      <span className="text-white text-[8px] font-bold uppercase">
        {gazeStatus === 'left' ? '← Gaze Left' : 'Gaze Right →'}
      </span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CameraOverlay = ({
  videoRef,
  canvasRef,
  overlayRef,
  status,
  faceStatus,
  isActive,
  violationCount = 0,
  streak = 0,
  brightness = 128,
  faceConfidence = null,
  lastEvent = null,
  // v4.0 new props
  noFaceWarningCount = 0,
  noFaceWarningsRemaining = 2,
  gazeStatus = 'center',
}) => {
  const [collapsed,      setCollapsed]      = useState(false);
  const [showSnapshot,   setShowSnapshot]   = useState(false);
  const [flashViolation, setFlashViolation] = useState(false);
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [toastWarningNum,  setToastWarningNum]  = useState(0);
  const [pos,            setPos]            = useState({ x: 24, y: null, bottom: 24 });
  const draggingRef   = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Flash on any violation or warning event
  useEffect(() => {
    if (!lastEvent) return;

    // If it's a soft warning, show the amber toast
    if (lastEvent.isWarningOnly && lastEvent.type === 'NO_FACE_WARNING') {
      setToastWarningNum(noFaceWarningCount);
      setShowWarningToast(true);
      const t = setTimeout(() => setShowWarningToast(false), 4000);
      return () => clearTimeout(t);
    }

    // Violation flash (red)
    setFlashViolation(true);
    const t = setTimeout(() => setFlashViolation(false), 600);
    return () => clearTimeout(t);
  }, [lastEvent, noFaceWarningCount]);

  const onMouseDown = useCallback((e) => {
    draggingRef.current = true;
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      setPos({ x: Math.max(0, Math.min(window.innerWidth-180, e.clientX-dragOffsetRef.current.x)), bottom: null, y: Math.max(0, e.clientY-dragOffsetRef.current.y) });
    };
    const onUp = () => { draggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  // ── Transient states ────────────────────────────────────────────────────────
  if (['requesting','loading_models','denied','model_error','error'].includes(status)) {
    return (
      <>
        <AlwaysMounted canvasRef={canvasRef} videoRef={videoRef} />
        <TransientBanner status={status} />
      </>
    );
  }

  if (status === 'idle' || !isActive) {
    return <AlwaysMounted canvasRef={canvasRef} videoRef={videoRef} />;
  }

  // ── Resolve effective face status — map gaze state for display ──────────────
  let displayFaceStatus = faceStatus;
  if (faceStatus === 'ok' && gazeStatus === 'left')  displayFaceStatus = 'gaze_left';
  if (faceStatus === 'ok' && gazeStatus === 'right') displayFaceStatus = 'gaze_right';

  const cfg        = FACE_STATUS_CONFIG[displayFaceStatus] || FACE_STATUS_CONFIG.ok;
  const StatusIcon = cfg.icon;
  const threat     = getThreatLevel(displayFaceStatus, violationCount, streak);
  const brightnessW = Math.max(4, Math.min(100, (brightness / 255) * 100));
  const posStyle = pos.y !== null
    ? { left: pos.x, top: pos.y, bottom: 'auto' }
    : { left: pos.x, bottom: pos.bottom };

  return (
    <>
      <AlwaysMounted canvasRef={canvasRef} videoRef={videoRef} />

      {/* v4.0 — No-face warning toast */}
      {showWarningToast && (
        <WarningToast warningNumber={toastWarningNum} warningsLeft={noFaceWarningsRemaining} />
      )}

      {showSnapshot && lastEvent?.snapshot && (
        <SnapshotModal snapshot={lastEvent.snapshot} label={lastEvent.label} onClose={() => setShowSnapshot(false)} />
      )}

      <div className="fixed z-50 flex flex-col items-start gap-1.5 select-none" style={posStyle}>

        {/* Header / drag handle */}
        <div
          className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm cursor-grab active:cursor-grabbing"
          onMouseDown={onMouseDown}
        >
          <Camera className="w-3 h-3 text-gray-500 shrink-0" />
          <span className="text-[11px] font-bold text-gray-600">Proctoring Cam</span>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: threat.color }}>
            {threat.label}
          </span>
          {violationCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0">{violationCount}</span>
          )}
          {/* v4.0 — warning counter badge */}
          {noFaceWarningCount > 0 && noFaceWarningCount <= 2 && (
            <span className="bg-amber-400 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shrink-0" title="No-face warnings">
              ⚠{noFaceWarningCount}
            </span>
          )}
          <button onClick={() => setCollapsed(p => !p)} className="ml-1 text-gray-400 hover:text-gray-600">
            {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* PiP camera window */}
        {!collapsed && (
          <div
            className={`relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${flashViolation ? 'brightness-125' : ''}`}
            style={{ width: 160, height: 120, outline: `2px solid ${cfg.ring}`, outlineOffset: cfg.pulse ? '1px' : '0px' }}
          >
            <PipCanvas videoRef={videoRef} width={160} height={120} />

            {/* Debug landmark overlay */}
            {overlayRef && (
              <canvas
                ref={overlayRef}
                width={160} height={120}
                className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
              />
            )}

            {/* LIVE badge */}
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/50 rounded-full px-1.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-[9px] font-bold uppercase tracking-wide">LIVE</span>
            </div>

            {/* Confidence chip */}
            {faceConfidence !== null && (
              <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full px-1.5 py-0.5">
                <span className="text-[9px] font-bold text-white">{faceConfidence}%</span>
              </div>
            )}

            {/* v4.0 Gaze direction indicator */}
            <GazeIndicator gazeStatus={gazeStatus} />

            {/* v4.0 Camera covered overlay */}
            {displayFaceStatus === 'covered' && (
              <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <Lock className="w-6 h-6 text-red-300" />
                <span className="text-red-200 text-[9px] font-bold text-center px-2 leading-tight">Camera Blocked</span>
              </div>
            )}

            {/* v4.0 Mobile device detected overlay */}
            {displayFaceStatus === 'mobile' && (
              <div className="absolute inset-0 bg-violet-900/60 flex flex-col items-center justify-center gap-1 pointer-events-none">
                <Smartphone className="w-6 h-6 text-violet-300" />
                <span className="text-violet-200 text-[9px] font-bold text-center px-2 leading-tight">Device Detected</span>
              </div>
            )}

            {/* Snapshot button */}
            {lastEvent?.snapshot && (
              <button
                onClick={() => setShowSnapshot(true)}
                className="absolute bottom-6 right-1.5 bg-black/50 rounded-full p-1 hover:bg-black/70 transition-colors"
                title="View violation snapshot"
              >
                <Image className="w-3 h-3 text-white" />
              </button>
            )}

            {/* Flash overlay */}
            {flashViolation && (
              <div className="absolute inset-0 bg-red-500/30 animate-pulse pointer-events-none rounded-xl" />
            )}

            {/* Status bar */}
            <div className={`absolute bottom-0 left-0 right-0 ${cfg.bg} px-2 py-1 flex items-center gap-1.5`}>
              <StatusIcon className="w-3 h-3 text-white shrink-0" />
              <span className="text-white text-[10px] font-bold truncate flex-1">{cfg.label}</span>
              {streak >= 2 && (
                <span className="text-white text-[9px] font-bold bg-white/20 rounded px-1">{streak}x</span>
              )}
            </div>
          </div>
        )}

        {/* Metrics bar */}
        {!collapsed && (
          <div className="w-[160px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Sun className="w-3 h-3 text-gray-400 shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${brightnessW}%`, backgroundColor: brightness < 30 ? '#ef4444' : brightness < 80 ? '#f59e0b' : '#22c55e' }}
                />
              </div>
              <span className="text-[9px] text-gray-400 font-bold">{Math.round(brightness)}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-3 h-3 text-gray-400 shrink-0" />
              <div className="flex-1 flex gap-0.5">
                {['LOW','MEDIUM','HIGH','CRITICAL'].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      ['LOW','MEDIUM','HIGH','CRITICAL'].indexOf(lvl) <= ['LOW','MEDIUM','HIGH','CRITICAL'].indexOf(threat.level)
                        ? THREAT_COLOURS[lvl] : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] font-bold" style={{ color: threat.color }}>{threat.label}</span>
            </div>

            {/* v4.0 — No-face warning progress */}
            {noFaceWarningCount > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                <div className="flex-1 flex gap-0.5">
                  {[1,2].map(n => (
                    <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${n <= noFaceWarningCount ? 'bg-amber-400' : 'bg-gray-100'}`} />
                  ))}
                  <div className={`flex-1 h-1.5 rounded-full transition-all ${noFaceWarningCount >= 3 ? 'bg-red-500' : 'bg-gray-100'}`} />
                </div>
                <span className="text-[9px] font-bold text-amber-500">
                  {noFaceWarningCount < 3 ? `Warn ${noFaceWarningCount}/2` : 'Violation!'}
                </span>
              </div>
            )}
          </div>
        )}

        {collapsed && isActive && <CollapsedBadge faceStatus={displayFaceStatus} violationCount={violationCount} />}
      </div>
    </>
  );
};

export default CameraOverlay;