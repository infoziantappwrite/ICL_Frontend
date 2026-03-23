/**
 * useProctoringGuard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A comprehensive browser-level proctoring guard for assessment sessions.
 *
 * Enforces:
 *  • Fullscreen lock  – student is forced into fullscreen and warned on exit
 *  • Tab/window blur  – tab switches and window minimisation are detected
 *  • Visibility API   – hidden-tab tricks are caught
 *  • Keyboard lockout – DevTools shortcuts, PrintScreen, clipboard combos
 *  • Copy / paste / cut / contextmenu  – right-click and clipboard blocked
 *  • DevTools heuristic – window size delta detection
 *  • Auto-submit      – after MAX_VIOLATIONS the assessment submits itself
 *
 * Every violation is:
 *   1. Added to a local in-memory log (for instant UI feedback)
 *   2. Sent to the backend via the `logEvent` API call
 *
 * Usage:
 *   const guard = useProctoringGuard({ submissionId, onAutoSubmit, enabled });
 *   guard.requestFullscreen()   ← call on "Begin Assessment"
 *   guard.exitFullscreen()      ← call on assessment submit/finish
 *   guard.violations            ← array of violation objects
 *   guard.warningCount          ← number of recorded violations
 *   guard.isFullscreen          ← boolean
 *   guard.isBlocked             ← boolean (student exceeded MAX_VIOLATIONS)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logEvent } from '../services/proctoringService';

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_VIOLATIONS      = 5;   // auto-submit after this many critical violations
const DEVTOOLS_THRESHOLD  = 160; // px delta that suggests devtools opened
const HEARTBEAT_INTERVAL  = 10_000; // ms — periodic alive ping

// ─── Violation types ──────────────────────────────────────────────────────────
export const VIOLATION = {
  FULLSCREEN_EXIT   : 'FULLSCREEN_EXIT',
  TAB_SWITCH        : 'TAB_SWITCH',
  WINDOW_BLUR       : 'WINDOW_BLUR',
  COPY_ATTEMPT      : 'COPY_ATTEMPT',
  PASTE_ATTEMPT     : 'PASTE_ATTEMPT',
  CUT_ATTEMPT       : 'CUT_ATTEMPT',
  CONTEXT_MENU      : 'CONTEXT_MENU',
  DEVTOOLS_OPEN     : 'DEVTOOLS_OPEN',
  KEYBOARD_SHORTCUT : 'KEYBOARD_SHORTCUT',
  PRINT_ATTEMPT     : 'PRINT_ATTEMPT',
};

// Severity: CRITICAL counts toward auto-submit; WARNING is just logged
const SEVERITY = {
  [VIOLATION.FULLSCREEN_EXIT]   : 'CRITICAL',
  [VIOLATION.TAB_SWITCH]        : 'CRITICAL',
  [VIOLATION.WINDOW_BLUR]       : 'CRITICAL',
  [VIOLATION.COPY_ATTEMPT]      : 'WARNING',
  [VIOLATION.PASTE_ATTEMPT]     : 'WARNING',
  [VIOLATION.CUT_ATTEMPT]       : 'WARNING',
  [VIOLATION.CONTEXT_MENU]      : 'WARNING',
  [VIOLATION.DEVTOOLS_OPEN]     : 'CRITICAL',
  [VIOLATION.KEYBOARD_SHORTCUT] : 'WARNING',
  [VIOLATION.PRINT_ATTEMPT]     : 'WARNING',
};

const LABELS = {
  [VIOLATION.FULLSCREEN_EXIT]   : 'Exited fullscreen mode',
  [VIOLATION.TAB_SWITCH]        : 'Switched to another tab or window',
  [VIOLATION.WINDOW_BLUR]       : 'Window lost focus',
  [VIOLATION.COPY_ATTEMPT]      : 'Attempted to copy content',
  [VIOLATION.PASTE_ATTEMPT]     : 'Attempted to paste content',
  [VIOLATION.CUT_ATTEMPT]       : 'Attempted to cut content',
  [VIOLATION.CONTEXT_MENU]      : 'Opened right-click context menu',
  [VIOLATION.DEVTOOLS_OPEN]     : 'Browser DevTools detected',
  [VIOLATION.KEYBOARD_SHORTCUT] : 'Used a restricted keyboard shortcut',
  [VIOLATION.PRINT_ATTEMPT]     : 'Attempted to print the page',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
const useProctoringGuard = ({ submissionId, onAutoSubmit, enabled = true }) => {
  const [violations, setViolations]       = useState([]);
  const [warningCount, setWarningCount]   = useState(0);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [isBlocked, setIsBlocked]         = useState(false);
  const [lastViolation, setLastViolation] = useState(null);

  // Ref so callbacks always read fresh values without stale closures
  const stateRef = useRef({ warningCount: 0, isBlocked: false, enabled });
  stateRef.current.enabled = enabled;

  // ── Record a violation ──────────────────────────────────────────────────────
  const recordViolation = useCallback(async (type, meta = {}) => {
    if (!stateRef.current.enabled || stateRef.current.isBlocked) return;

    const entry = {
      id        : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      severity  : SEVERITY[type] || 'WARNING',
      label     : LABELS[type]   || type,
      timestamp : new Date().toISOString(),
      ...meta,
    };

    // Update local state
    setViolations(prev => [...prev, entry]);
    setLastViolation(entry);

    if (entry.severity === 'CRITICAL') {
      const newCount = stateRef.current.warningCount + 1;
      stateRef.current.warningCount = newCount;
      setWarningCount(newCount);

      if (newCount >= MAX_VIOLATIONS) {
        stateRef.current.isBlocked = true;
        setIsBlocked(true);
        onAutoSubmit?.('proctoring_violation');
      }
    }

    // Fire-and-forget backend log — don't let a network error crash the guard
    if (submissionId) {
      logEvent({
        submission_id : submissionId,
        event_type    : type,
        severity      : entry.severity,
        details       : { label: entry.label, ...meta },
        timestamp     : entry.timestamp,
      }).catch(() => {/* silent */});
    }
  }, [submissionId, onAutoSubmit]);

  // ── Fullscreen API ──────────────────────────────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen)             await el.requestFullscreen();
      else if (el.webkitRequestFullscreen)  await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen)     await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen)      await el.msRequestFullscreen();
      setIsFullscreen(true);
    } catch {
      // User denied fullscreen — record but don't block
      recordViolation(VIOLATION.FULLSCREEN_EXIT, { reason: 'denied_by_browser' });
    }
  }, [recordViolation]);

  const exitFullscreen = useCallback(() => {
    try {
      if (document.exitFullscreen)             document.exitFullscreen();
      else if (document.webkitExitFullscreen)  document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)   document.mozCancelFullScreen();
      else if (document.msExitFullscreen)      document.msExitFullscreen();
    } catch {/* ignore */}
    setIsFullscreen(false);
  }, []);

  // ── Register all proctoring listeners ──────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    // 1. Fullscreen change
    const onFullscreenChange = () => {
      const fsEl = document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement;
      const nowFs = Boolean(fsEl);
      setIsFullscreen(nowFs);
      if (!nowFs && stateRef.current.enabled) {
        recordViolation(VIOLATION.FULLSCREEN_EXIT);
      }
    };

    // 2. Page visibility (tab switch / background)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordViolation(VIOLATION.TAB_SWITCH);
      }
    };

    // 3. Window blur (alt-tab, click outside browser, etc.)
    const onWindowBlur = () => {
      recordViolation(VIOLATION.WINDOW_BLUR);
    };

    // 4. Context menu (right-click)
    const onContextMenu = (e) => {
      e.preventDefault();
      recordViolation(VIOLATION.CONTEXT_MENU);
    };

    // 5. Copy / paste / cut
    const onCopy = (e) => { e.preventDefault(); recordViolation(VIOLATION.COPY_ATTEMPT); };
    const onPaste = (e) => { e.preventDefault(); recordViolation(VIOLATION.PASTE_ATTEMPT); };
    const onCut   = (e) => { e.preventDefault(); recordViolation(VIOLATION.CUT_ATTEMPT); };

    // 6. Keyboard shortcuts
    const onKeyDown = (e) => {
      const k = e.key?.toUpperCase();
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // DevTools shortcuts
      if (k === 'F12') { e.preventDefault(); recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'F12' }); return; }
      if (ctrl && shift && (k === 'I' || k === 'J' || k === 'C')) {
        e.preventDefault(); recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: `Ctrl+Shift+${k}` }); return;
      }
      // PrintScreen
      if (k === 'PRINTSCREEN') { recordViolation(VIOLATION.PRINT_ATTEMPT, { key: 'PrintScreen' }); return; }
      // Print dialog
      if (ctrl && k === 'P') { e.preventDefault(); recordViolation(VIOLATION.PRINT_ATTEMPT, { key: 'Ctrl+P' }); return; }
      // Select All + Copy combo
      if (ctrl && k === 'A') { e.preventDefault(); return; }
      // Find (could reveal source structure)
      if (ctrl && k === 'U') { e.preventDefault(); recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Ctrl+U' }); return; }
      // Save page
      if (ctrl && k === 'S') { e.preventDefault(); return; }
      // Reload  (prevent losing state mid-exam)
      if (k === 'F5' || (ctrl && k === 'R')) { e.preventDefault(); return; }
      // Task switch warning (Alt+Tab can't be fully blocked, just logged)
      if (e.altKey && k === 'TAB') { recordViolation(VIOLATION.TAB_SWITCH, { key: 'Alt+Tab' }); }
    };

    // 7. DevTools size heuristic
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const widthDelta  = Math.abs(window.outerWidth  - window.innerWidth);
      const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
      const opened = widthDelta > DEVTOOLS_THRESHOLD || heightDelta > DEVTOOLS_THRESHOLD;
      if (opened && !devtoolsOpen) {
        devtoolsOpen = true;
        recordViolation(VIOLATION.DEVTOOLS_OPEN);
      } else if (!opened) {
        devtoolsOpen = false;
      }
    };
    const devtoolsInterval = setInterval(detectDevTools, 1_500);

    // 8. Heartbeat (periodic liveness ping to backend)
    const heartbeatInterval = setInterval(() => {
      if (submissionId && stateRef.current.enabled && !stateRef.current.isBlocked) {
        logEvent({
          submission_id : submissionId,
          event_type    : 'HEARTBEAT',
          severity      : 'INFO',
          details       : { warningCount: stateRef.current.warningCount },
          timestamp     : new Date().toISOString(),
        }).catch(() => {});
      }
    }, HEARTBEAT_INTERVAL);

    // ── Attach ────────────────────────────────────────────────────────────────
    document.addEventListener('fullscreenchange',       onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange',    onFullscreenChange);
    document.addEventListener('MSFullscreenChange',     onFullscreenChange);
    document.addEventListener('visibilitychange',       onVisibilityChange);
    window.addEventListener('blur',                     onWindowBlur);
    document.addEventListener('contextmenu',            onContextMenu);
    document.addEventListener('copy',                   onCopy);
    document.addEventListener('paste',                  onPaste);
    document.addEventListener('cut',                    onCut);
    document.addEventListener('keydown',                onKeyDown);

    return () => {
      clearInterval(devtoolsInterval);
      clearInterval(heartbeatInterval);
      document.removeEventListener('fullscreenchange',       onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange',    onFullscreenChange);
      document.removeEventListener('MSFullscreenChange',     onFullscreenChange);
      document.removeEventListener('visibilitychange',       onVisibilityChange);
      window.removeEventListener('blur',                     onWindowBlur);
      document.removeEventListener('contextmenu',            onContextMenu);
      document.removeEventListener('copy',                   onCopy);
      document.removeEventListener('paste',                  onPaste);
      document.removeEventListener('cut',                    onCut);
      document.removeEventListener('keydown',                onKeyDown);
    };
  }, [enabled, recordViolation, submissionId]);

  return {
    violations,
    warningCount,
    criticalViolationsRemaining : Math.max(0, MAX_VIOLATIONS - warningCount),
    isFullscreen,
    isBlocked,
    lastViolation,
    requestFullscreen,
    exitFullscreen,
    MAX_VIOLATIONS,
  };
};

export default useProctoringGuard;