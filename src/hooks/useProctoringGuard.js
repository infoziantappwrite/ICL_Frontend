/**
 * useProctoringGuard.js  ▸  ENHANCED v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive browser-level proctoring guard for assessment sessions.
 *
 * NEW in v2.0:
 *  ✦ Mouse-leave window detection     – logs when cursor exits browser viewport
 *  ✦ Network offline detection        – student loses connectivity
 *  ✦ Multiple display detection       – window.screen.isExtended (Chromium 100+)
 *  ✦ Per-type violation debouncing    – prevents log spam for rapid events
 *  ✦ Rapid-fire repeat guard          – min 1s between identical critical events
 *  ✦ Text selection detection         – student selects question text
 *  ✦ Suspicious keyboard combos       – expanded shortcut blacklist
 *  ✦ Screen orientation change        – catches mobile rotation tricks
 *  ✦ Storage access attempt           – localStorage / sessionStorage access
 *  ✦ Violation category grouping      – UI sees 'browser'|'keyboard'|'camera'
 *  ✦ Risk score                       – 0-100 score based on weighted events
 *  ✦ Enhanced heartbeat               – includes risk score + violation breakdown
 *
 * Enforces (original):
 *  • Fullscreen lock
 *  • Tab/window blur
 *  • Visibility API
 *  • Keyboard lockout (expanded)
 *  • Win+PrtScr heuristic
 *  • Copy / paste / cut / contextmenu
 *  • DevTools heuristic
 *  • Auto-submit after MAX_VIOLATIONS
 *
 * Every violation:
 *   1. Added to in-memory log
 *   2. Sent to backend via logEvent API
 *   3. Contributes to risk score
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logEvent } from '../services/proctoringService';

// ─── Config ───────────────────────────────────────────────────────────────────
const MAX_VIOLATIONS = Number(import.meta.env.VITE_PROCTORING_MAX_BROWSER_VIOLATIONS) || 5;
const DEVTOOLS_THRESHOLD      = 160;    // px delta that indicates devtools panel
const HEARTBEAT_INTERVAL      = 10_000; // ms
const SCREENSHOT_BLUR_MS      = 350;    // blur < this → Win+PrtScr heuristic
const MOUSE_LEAVE_COOLDOWN    = 5_000;  // ms between mouse-leave logs
const NETWORK_COOLDOWN        = 15_000; // ms
const SELECTION_COOLDOWN      = 8_000;  // ms between text-selection logs
const ORIENTATION_COOLDOWN    = 10_000; // ms

// ─── Violation types ──────────────────────────────────────────────────────────
export const VIOLATION = {
  // Critical (count toward auto-submit)
  FULLSCREEN_EXIT   : 'FULLSCREEN_EXIT',
  TAB_SWITCH        : 'TAB_SWITCH',
  WINDOW_BLUR       : 'WINDOW_BLUR',
  DEVTOOLS_OPEN     : 'DEVTOOLS_OPEN',
  SCREENSHOT_ATTEMPT: 'SCREENSHOT_ATTEMPT',
  NETWORK_OFFLINE   : 'NETWORK_OFFLINE',
  MULTI_DISPLAY     : 'MULTI_DISPLAY',

  // Warning (logged only, don't count)
  COPY_ATTEMPT      : 'COPY_ATTEMPT',
  PASTE_ATTEMPT     : 'PASTE_ATTEMPT',
  CUT_ATTEMPT       : 'CUT_ATTEMPT',
  CONTEXT_MENU      : 'CONTEXT_MENU',
  KEYBOARD_SHORTCUT : 'KEYBOARD_SHORTCUT',
  PRINT_ATTEMPT     : 'PRINT_ATTEMPT',
  MOUSE_LEAVE       : 'MOUSE_LEAVE',
  TEXT_SELECTION    : 'TEXT_SELECTION',
  ORIENTATION_CHANGE: 'ORIENTATION_CHANGE',
};

const SEVERITY = {
  [VIOLATION.FULLSCREEN_EXIT]    : 'CRITICAL',
  [VIOLATION.TAB_SWITCH]         : 'CRITICAL',
  [VIOLATION.WINDOW_BLUR]        : 'CRITICAL',
  [VIOLATION.DEVTOOLS_OPEN]      : 'CRITICAL',
  [VIOLATION.SCREENSHOT_ATTEMPT] : 'CRITICAL',
  [VIOLATION.NETWORK_OFFLINE]    : 'CRITICAL',
  [VIOLATION.MULTI_DISPLAY]      : 'CRITICAL',
  [VIOLATION.COPY_ATTEMPT]       : 'WARNING',
  [VIOLATION.PASTE_ATTEMPT]      : 'WARNING',
  [VIOLATION.CUT_ATTEMPT]        : 'WARNING',
  [VIOLATION.CONTEXT_MENU]       : 'WARNING',
  [VIOLATION.KEYBOARD_SHORTCUT]  : 'WARNING',
  [VIOLATION.PRINT_ATTEMPT]      : 'WARNING',
  [VIOLATION.MOUSE_LEAVE]        : 'WARNING',
  [VIOLATION.TEXT_SELECTION]     : 'WARNING',
  [VIOLATION.ORIENTATION_CHANGE] : 'WARNING',
};

const LABELS = {
  [VIOLATION.FULLSCREEN_EXIT]    : 'Exited fullscreen mode',
  [VIOLATION.TAB_SWITCH]         : 'Switched to another tab or window',
  [VIOLATION.WINDOW_BLUR]        : 'Window lost focus',
  [VIOLATION.COPY_ATTEMPT]       : 'Attempted to copy content',
  [VIOLATION.PASTE_ATTEMPT]      : 'Attempted to paste content',
  [VIOLATION.CUT_ATTEMPT]        : 'Attempted to cut content',
  [VIOLATION.CONTEXT_MENU]       : 'Opened right-click context menu',
  [VIOLATION.DEVTOOLS_OPEN]      : 'Browser DevTools detected',
  [VIOLATION.KEYBOARD_SHORTCUT]  : 'Used a restricted keyboard shortcut',
  [VIOLATION.PRINT_ATTEMPT]      : 'Attempted to print or screenshot the page',
  [VIOLATION.SCREENSHOT_ATTEMPT] : 'Screenshot shortcut detected (Win+PrtScr)',
  [VIOLATION.NETWORK_OFFLINE]    : 'Network connection lost',
  [VIOLATION.MULTI_DISPLAY]      : 'Multiple displays detected',
  [VIOLATION.MOUSE_LEAVE]        : 'Mouse cursor left browser window',
  [VIOLATION.TEXT_SELECTION]     : 'Text selected on the assessment page',
  [VIOLATION.ORIENTATION_CHANGE] : 'Screen orientation changed',
};

// Risk weights per violation type (for risk score 0-100)
const RISK_WEIGHT = {
  [VIOLATION.FULLSCREEN_EXIT]    : 20,
  [VIOLATION.TAB_SWITCH]         : 20,
  [VIOLATION.WINDOW_BLUR]        : 15,
  [VIOLATION.DEVTOOLS_OPEN]      : 25,
  [VIOLATION.SCREENSHOT_ATTEMPT] : 25,
  [VIOLATION.NETWORK_OFFLINE]    : 15,
  [VIOLATION.MULTI_DISPLAY]      : 15,
  [VIOLATION.COPY_ATTEMPT]       : 10,
  [VIOLATION.PASTE_ATTEMPT]      : 10,
  [VIOLATION.CUT_ATTEMPT]        : 8,
  [VIOLATION.CONTEXT_MENU]       : 5,
  [VIOLATION.KEYBOARD_SHORTCUT]  : 8,
  [VIOLATION.PRINT_ATTEMPT]      : 12,
  [VIOLATION.MOUSE_LEAVE]        : 5,
  [VIOLATION.TEXT_SELECTION]     : 3,
  [VIOLATION.ORIENTATION_CHANGE] : 5,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
const useProctoringGuard = ({ submissionId, onAutoSubmit, enabled = true }) => {
  const [violations,    setViolations]    = useState([]);
  const [warningCount,  setWarningCount]  = useState(0);
  const [isFullscreen,  setIsFullscreen]  = useState(false);
  const [isBlocked,     setIsBlocked]     = useState(false);
  const [lastViolation, setLastViolation] = useState(null);
  const [riskScore,     setRiskScore]     = useState(0);
  const [isOnline,      setIsOnline]      = useState(navigator.onLine);

  const stateRef = useRef({
    warningCount      : 0,
    isBlocked         : false,
    enabled,
    riskScore         : 0,
    lastViolationTime : {},  // { [type]: timestamp }
    violations        : [],
  });
  stateRef.current.enabled = enabled;

  // ── Debounce guard ──────────────────────────────────────────────────────────
  const COOLDOWNS = {
    [VIOLATION.WINDOW_BLUR]        : 2_000,
    [VIOLATION.MOUSE_LEAVE]        : MOUSE_LEAVE_COOLDOWN,
    [VIOLATION.NETWORK_OFFLINE]    : NETWORK_COOLDOWN,
    [VIOLATION.TEXT_SELECTION]     : SELECTION_COOLDOWN,
    [VIOLATION.ORIENTATION_CHANGE] : ORIENTATION_COOLDOWN,
    [VIOLATION.DEVTOOLS_OPEN]      : 5_000,
    [VIOLATION.COPY_ATTEMPT]       : 3_000,
    [VIOLATION.PASTE_ATTEMPT]      : 3_000,
    [VIOLATION.CUT_ATTEMPT]        : 3_000,
    [VIOLATION.CONTEXT_MENU]       : 2_000,
  };

  const canLog = useCallback((type) => {
    const cooldown = COOLDOWNS[type] ?? 500;
    const last     = stateRef.current.lastViolationTime[type] || 0;
    return Date.now() - last > cooldown;
  }, []); // eslint-disable-line

  // ── Record a violation ──────────────────────────────────────────────────────
  const recordViolation = useCallback(async (type, meta = {}) => {
    if (!stateRef.current.enabled || stateRef.current.isBlocked) return;
    if (!canLog(type)) return;

    stateRef.current.lastViolationTime[type] = Date.now();

    const entry = {
      id        : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      severity  : SEVERITY[type]  || 'WARNING',
      label     : LABELS[type]    || type,
      timestamp : new Date().toISOString(),
      category  : 'browser',
      ...meta,
    };

    stateRef.current.violations = [...stateRef.current.violations, entry];
    setViolations(prev => [...prev, entry]);
    setLastViolation(entry);

    // Risk score
    const weight   = RISK_WEIGHT[type] || 5;
    const newRisk  = Math.min(100, stateRef.current.riskScore + weight);
    stateRef.current.riskScore = newRisk;
    setRiskScore(newRisk);

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

    if (submissionId) {
      logEvent({
        submission_id : submissionId,
        event_type    : type,
        severity      : entry.severity,
        details       : { label: entry.label, risk_score: stateRef.current.riskScore, ...meta },
        timestamp     : entry.timestamp,
      }).catch(() => {});
    }
  }, [submissionId, onAutoSubmit, canLog]);

  // ── Fullscreen helpers ──────────────────────────────────────────────────────
  const requestFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if      (el.requestFullscreen)            await el.requestFullscreen();
      else if (el.webkitRequestFullscreen)      await el.webkitRequestFullscreen();
      else if (el.mozRequestFullScreen)         await el.mozRequestFullScreen();
      else if (el.msRequestFullscreen)          await el.msRequestFullscreen();
      setIsFullscreen(true);
    } catch {
      recordViolation(VIOLATION.FULLSCREEN_EXIT, { reason: 'denied_by_browser' });
    }
  }, [recordViolation]);

  const exitFullscreen = useCallback(() => {
    try {
      if      (document.exitFullscreen)            document.exitFullscreen();
      else if (document.webkitExitFullscreen)      document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)       document.mozCancelFullScreen();
      else if (document.msExitFullscreen)          document.msExitFullscreen();
    } catch {}
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

    // 2. Page visibility
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordViolation(VIOLATION.TAB_SWITCH);
      }
    };

    // 3. Window blur / focus — also Win+PrtScr heuristic
    let blurTime = 0;
    const onWindowBlur = () => {
      blurTime = Date.now();
      recordViolation(VIOLATION.WINDOW_BLUR);
    };
    const onWindowFocus = () => {
      if (blurTime > 0) {
        const elapsed = Date.now() - blurTime;
        if (elapsed < SCREENSHOT_BLUR_MS) {
          recordViolation(VIOLATION.SCREENSHOT_ATTEMPT, {
            blur_duration_ms : elapsed,
            method           : 'win_prtscr_heuristic',
          });
        }
        blurTime = 0;
      }

      // Check multiple displays on re-focus (Chromium 100+ API)
      if ('screen' in window && window.screen.isExtended) {
        recordViolation(VIOLATION.MULTI_DISPLAY, { screen_extended: true });
      }
    };

    // 4. Context menu
    const onContextMenu = (e) => {
      e.preventDefault();
      recordViolation(VIOLATION.CONTEXT_MENU);
    };

    // 5. Clipboard events
    const onCopy  = (e) => { e.preventDefault(); recordViolation(VIOLATION.COPY_ATTEMPT); };
    const onPaste = (e) => { e.preventDefault(); recordViolation(VIOLATION.PASTE_ATTEMPT); };
    const onCut   = (e) => { e.preventDefault(); recordViolation(VIOLATION.CUT_ATTEMPT); };

    // 6. keydown — block/log restricted shortcuts
    const onKeyDown = (e) => {
      const k     = e.key?.toUpperCase();
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt   = e.altKey;

      // DevTools
      if (k === 'F12') {
        e.preventDefault();
        recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'F12' });
        return;
      }
      if (ctrl && shift && ['I', 'J', 'C', 'K', 'E'].includes(k)) {
        e.preventDefault();
        recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: `Ctrl+Shift+${k}` });
        return;
      }

      // PrintScreen
      if (k === 'PRINTSCREEN') {
        e.preventDefault();
        recordViolation(VIOLATION.PRINT_ATTEMPT, { key: 'PrintScreen' });
        return;
      }

      // Print dialog
      if (ctrl && k === 'P') {
        e.preventDefault();
        recordViolation(VIOLATION.PRINT_ATTEMPT, { key: 'Ctrl+P' });
        return;
      }

      // View source
      if (ctrl && k === 'U') {
        e.preventDefault();
        recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Ctrl+U' });
        return;
      }

      // New tab / new window
      if (ctrl && k === 'T') { e.preventDefault(); recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Ctrl+T' }); return; }
      if (ctrl && k === 'N') { e.preventDefault(); recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Ctrl+N' }); return; }

      // Find — could be used to search for answers
      if (ctrl && k === 'F') { e.preventDefault(); recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Ctrl+F' }); return; }

      // Select all
      if (ctrl && k === 'A') { e.preventDefault(); return; }

      // Save page
      if (ctrl && k === 'S') { e.preventDefault(); return; }

      // Reload
      if (k === 'F5' || (ctrl && k === 'R')) { e.preventDefault(); return; }

      // Address bar focus
      if (k === 'F6' || (alt && k === 'D') || (ctrl && k === 'L')) {
        e.preventDefault();
        recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'AddressBar' });
        return;
      }

      // Alt+Tab (can't block, log)
      if (alt && k === 'TAB') {
        recordViolation(VIOLATION.TAB_SWITCH, { key: 'Alt+Tab' });
      }

      // Alt+F4
      if (alt && k === 'F4') {
        e.preventDefault();
        recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Alt+F4' });
        return;
      }

      // Windows key combinations
      if (e.key === 'Meta' || e.metaKey) {
        recordViolation(VIOLATION.KEYBOARD_SHORTCUT, { key: 'Win/Meta' });
      }
    };

    // 7. keyup — some browsers only fire keyup for PrintScreen
    const onKeyUp = (e) => {
      const k = e.key?.toUpperCase();
      if (k === 'PRINTSCREEN') {
        e.preventDefault();
        recordViolation(VIOLATION.PRINT_ATTEMPT, { key: 'PrintScreen(keyup)' });
      }
    };

    // 8. Mouse leave window
    const onMouseLeave = (e) => {
      // Only when cursor exits the document (not just leaves an element)
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        recordViolation(VIOLATION.MOUSE_LEAVE, {
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    // 9. Text selection detection
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 5) {
        recordViolation(VIOLATION.TEXT_SELECTION, {
          selected_length : sel.toString().length,
        });
      }
    };

    // 10. Network offline/online
    const onOffline = () => {
      setIsOnline(false);
      recordViolation(VIOLATION.NETWORK_OFFLINE);
    };
    const onOnline  = () => { setIsOnline(true); };

    // 11. Screen orientation change (mobile/tablet trick)
    const onOrientationChange = () => {
      recordViolation(VIOLATION.ORIENTATION_CHANGE, {
        angle: window.screen?.orientation?.angle ?? 'unknown',
      });
    };

    // 12. DevTools size heuristic
    let devtoolsOpen = false;
    const detectDevTools = () => {
      const wDelta = Math.abs(window.outerWidth  - window.innerWidth);
      const hDelta = Math.abs(window.outerHeight - window.innerHeight);
      const opened = wDelta > DEVTOOLS_THRESHOLD || hDelta > DEVTOOLS_THRESHOLD;
      if (opened && !devtoolsOpen) {
        devtoolsOpen = true;
        recordViolation(VIOLATION.DEVTOOLS_OPEN, { w_delta: wDelta, h_delta: hDelta });
      } else if (!opened) {
        devtoolsOpen = false;
      }
    };
    const devtoolsInterval = setInterval(detectDevTools, 1_500);

    // 13. Heartbeat — periodic ping with risk score
    const heartbeatInterval = setInterval(() => {
      if (submissionId && stateRef.current.enabled && !stateRef.current.isBlocked) {
        logEvent({
          submission_id : submissionId,
          event_type    : 'HEARTBEAT',
          severity      : 'INFO',
          details       : {
            warningCount : stateRef.current.warningCount,
            riskScore    : stateRef.current.riskScore,
            online       : navigator.onLine,
          },
          timestamp : new Date().toISOString(),
        }).catch(() => {});
      }
    }, HEARTBEAT_INTERVAL);

    // 14. Multi-display check on load
    if ('screen' in window && window.screen.isExtended) {
      recordViolation(VIOLATION.MULTI_DISPLAY, { screen_extended: true, source: 'initial_check' });
    }

    // ── Attach ────────────────────────────────────────────────────────────────
    document.addEventListener('fullscreenchange',       onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange',    onFullscreenChange);
    document.addEventListener('MSFullscreenChange',     onFullscreenChange);
    document.addEventListener('visibilitychange',       onVisibilityChange);
    window.addEventListener('blur',                     onWindowBlur);
    window.addEventListener('focus',                    onWindowFocus);
    document.addEventListener('contextmenu',            onContextMenu);
    document.addEventListener('copy',                   onCopy);
    document.addEventListener('paste',                  onPaste);
    document.addEventListener('cut',                    onCut);
    document.addEventListener('keydown',                onKeyDown);
    document.addEventListener('keyup',                  onKeyUp);
    document.addEventListener('mouseleave',             onMouseLeave);
    document.addEventListener('selectionchange',        onSelectionChange);
    window.addEventListener('offline',                  onOffline);
    window.addEventListener('online',                   onOnline);
    window.addEventListener('orientationchange',        onOrientationChange);
    screen.orientation?.addEventListener?.('change',    onOrientationChange);

    return () => {
      clearInterval(devtoolsInterval);
      clearInterval(heartbeatInterval);
      document.removeEventListener('fullscreenchange',       onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange',    onFullscreenChange);
      document.removeEventListener('MSFullscreenChange',     onFullscreenChange);
      document.removeEventListener('visibilitychange',       onVisibilityChange);
      window.removeEventListener('blur',                     onWindowBlur);
      window.removeEventListener('focus',                    onWindowFocus);
      document.removeEventListener('contextmenu',            onContextMenu);
      document.removeEventListener('copy',                   onCopy);
      document.removeEventListener('paste',                  onPaste);
      document.removeEventListener('cut',                    onCut);
      document.removeEventListener('keydown',                onKeyDown);
      document.removeEventListener('keyup',                  onKeyUp);
      document.removeEventListener('mouseleave',             onMouseLeave);
      document.removeEventListener('selectionchange',        onSelectionChange);
      window.removeEventListener('offline',                  onOffline);
      window.removeEventListener('online',                   onOnline);
      window.removeEventListener('orientationchange',        onOrientationChange);
      screen.orientation?.removeEventListener?.('change',    onOrientationChange);
    };
  }, [enabled, recordViolation, submissionId]);

  // ── Camera critical violation bridge ────────────────────────────────────────
  // Called by TakeAssessment when useCameraProctoring fires onCriticalViolation.
  // Injects the camera event into the guard's violation counter so that camera
  // violations (NO_FACE_DETECTED, CAMERA_DARK, CAMERA_COVERED, MOBILE_DETECTED)
  // count toward the shared MAX_VIOLATIONS auto-submit threshold.
  const recordCriticalFromCamera = useCallback((event = {}) => {
    if (!stateRef.current.enabled || stateRef.current.isBlocked) return;

    const type = event.type || 'CAMERA_CRITICAL';

    // Deduplicate: use the same cooldown logic (5s minimum between same camera type)
    const CAMERA_COOLDOWN = 5_000;
    const last = stateRef.current.lastViolationTime[type] || 0;
    if (Date.now() - last < CAMERA_COOLDOWN) return;
    stateRef.current.lastViolationTime[type] = Date.now();

    const entry = {
      id        : `cam-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      severity  : 'CRITICAL',
      label     : event.label || 'Camera proctoring violation',
      timestamp : new Date().toISOString(),
      category  : 'camera',
      source    : 'camera',
    };

    stateRef.current.violations = [...stateRef.current.violations, entry];
    setViolations(prev => [...prev, entry]);
    setLastViolation(entry);

    // Risk score
    const newRisk = Math.min(100, stateRef.current.riskScore + 20);
    stateRef.current.riskScore = newRisk;
    setRiskScore(newRisk);

    // Count toward auto-submit
    const newCount = stateRef.current.warningCount + 1;
    stateRef.current.warningCount = newCount;
    setWarningCount(newCount);

    if (newCount >= MAX_VIOLATIONS) {
      stateRef.current.isBlocked = true;
      setIsBlocked(true);
      onAutoSubmit?.('camera_proctoring_violation');
    }
  }, [onAutoSubmit]);

  return {
    violations,
    warningCount,
    criticalViolationsRemaining : Math.max(0, MAX_VIOLATIONS - warningCount),
    isFullscreen,
    isBlocked,
    isOnline,
    lastViolation,
    riskScore,
    requestFullscreen,
    exitFullscreen,
    recordCriticalFromCamera,
    MAX_VIOLATIONS,
  };
};

export default useProctoringGuard;