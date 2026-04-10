/**
 * useCameraProctoring.js  ▸  ENHANCED v3.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side AI camera proctoring using face-api.js (installed via npm).
 *
 * NEW in v3.0:
 *  ✦ Eyeball / gaze tracking        – detects eyes looking left/right (not just head pose)
 *  ✦ Mobile / device detection      – scans for phone/tablet shaped objects in frame
 *  ✦ Face-not-detected warning flow – first 2 absences = WARNING only, 3rd+ = VIOLATION
 *  ✦ Camera hidden / covered        – sudden blank/covered feed logged as CRITICAL violation
 *
 * All v2.1 fixes preserved (npm faceapi, local models, stale-closure fix, etc.)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { logEvent } from '../services/proctoringService';

// ─── Scan Config ──────────────────────────────────────────────────────────────
const SCAN_INTERVAL_OK        = 5000;
const SCAN_INTERVAL_VIOLATION = 2000;
const VIDEO_WIDTH             = 320;
const VIDEO_HEIGHT            = 240;
const DETECTION_THRESHOLD     = 0.45;
const FACE_API_INPUT_SIZE     = 224;

const TURN_THRESHOLD     = 0.30;
const DOWN_THRESHOLD     = 0.55;
const FACE_MIN_AREA_PCT  = 0.04;
const DARK_THRESHOLD     = 30;
const EAR_THRESHOLD      = 0.22;
const EYE_CLOSED_FRAMES  = 2;
const CONSECUTIVE_NO_FACE_CRITICAL = 3;

// ─── v3.0 Config ──────────────────────────────────────────────────────────────
const GAZE_SIDE_THRESHOLD        = 0.30;  // iris offset ratio → looking sideways
const GAZE_FRAMES_REQUIRED       = 2;     // consecutive frames before gaze violation
const COVER_UNIFORMITY_THRESHOLD = 8;     // frame std-dev below this = covered
const COVER_FRAMES_REQUIRED      = 2;     // consecutive covered frames before violation
const NO_FACE_WARNING_LIMIT      = 2;     // first N no-face = warning; after = violation
const MOBILE_DETECT_INTERVAL     = 15000; // ms between mobile-device scans

const VIOLATION_COOLDOWN = {
  NO_FACE_DETECTED  : 8000,
  NO_FACE_WARNING   : 10000,
  MULTIPLE_FACES    : 8000,
  FACE_TURNED_AWAY  : 10000,
  FACE_LOOKING_DOWN : 10000,
  EYES_CLOSED       : 12000,
  FACE_TOO_SMALL    : 15000,
  CAMERA_DARK       : 20000,
  FACE_OBSCURED     : 15000,
  GAZE_AWAY         : 10000,
  CAMERA_COVERED    : 15000,
  MOBILE_DETECTED   : 20000,
};

const MODELS_URL = '/models';

// ─── Violation types ──────────────────────────────────────────────────────────
export const CAM_VIOLATION = {
  NO_FACE_DETECTED  : 'NO_FACE_DETECTED',
  NO_FACE_WARNING   : 'NO_FACE_WARNING',
  MULTIPLE_FACES    : 'MULTIPLE_FACES',
  FACE_TURNED_AWAY  : 'FACE_TURNED_AWAY',
  FACE_LOOKING_DOWN : 'FACE_LOOKING_DOWN',
  EYES_CLOSED       : 'EYES_CLOSED',
  FACE_TOO_SMALL    : 'FACE_TOO_SMALL',
  CAMERA_DARK       : 'CAMERA_DARK',
  FACE_OBSCURED     : 'FACE_OBSCURED',
  GAZE_AWAY         : 'GAZE_AWAY',
  CAMERA_COVERED    : 'CAMERA_COVERED',
  MOBILE_DETECTED   : 'MOBILE_DETECTED',
};

export const CAM_LABELS = {
  [CAM_VIOLATION.NO_FACE_DETECTED]  : 'Face not visible on camera',
  [CAM_VIOLATION.NO_FACE_WARNING]   : 'Face not detected — Warning',
  [CAM_VIOLATION.MULTIPLE_FACES]    : 'Multiple faces detected in frame',
  [CAM_VIOLATION.FACE_TURNED_AWAY]  : 'Face turned away from screen',
  [CAM_VIOLATION.FACE_LOOKING_DOWN] : 'Student appears to be looking down',
  [CAM_VIOLATION.EYES_CLOSED]       : 'Eyes appear closed',
  [CAM_VIOLATION.FACE_TOO_SMALL]    : 'Face too small — camera may be covered',
  [CAM_VIOLATION.CAMERA_DARK]       : 'Camera feed too dark',
  [CAM_VIOLATION.FACE_OBSCURED]     : 'Face partially obscured',
  [CAM_VIOLATION.GAZE_AWAY]         : 'Eyes not focused on screen',
  [CAM_VIOLATION.CAMERA_COVERED]    : 'Camera appears to be covered or blocked',
  [CAM_VIOLATION.MOBILE_DETECTED]   : 'Mobile device or secondary screen detected',
};

export const CAM_SEVERITY = {
  [CAM_VIOLATION.NO_FACE_DETECTED]  : 'CRITICAL',
  [CAM_VIOLATION.NO_FACE_WARNING]   : 'WARNING',
  [CAM_VIOLATION.MULTIPLE_FACES]    : 'CRITICAL',
  [CAM_VIOLATION.FACE_TURNED_AWAY]  : 'WARNING',
  [CAM_VIOLATION.FACE_LOOKING_DOWN] : 'WARNING',
  [CAM_VIOLATION.EYES_CLOSED]       : 'WARNING',
  [CAM_VIOLATION.FACE_TOO_SMALL]    : 'WARNING',
  [CAM_VIOLATION.CAMERA_DARK]       : 'CRITICAL',
  [CAM_VIOLATION.FACE_OBSCURED]     : 'WARNING',
  [CAM_VIOLATION.GAZE_AWAY]         : 'WARNING',
  [CAM_VIOLATION.CAMERA_COVERED]    : 'CRITICAL',
  [CAM_VIOLATION.MOBILE_DETECTED]   : 'CRITICAL',
};

// ─── Models loading (singleton Promise lock) ──────────────────────────────────
let modelsLoadPromise = null;
const loadModels = () => {
  if (modelsLoadPromise) return modelsLoadPromise;
  modelsLoadPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
  ]).catch((err) => { modelsLoadPromise = null; throw err; });
  return modelsLoadPromise;
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────
const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const eyeAspectRatio = (pts, start) => {
  const p1 = pts[start], p2 = pts[start+1], p3 = pts[start+2];
  const p4 = pts[start+3], p5 = pts[start+4], p6 = pts[start+5];
  return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
};

const getFrameLuminance = (ctx, w, h) => {
  const d = ctx.getImageData(0,0,w,h).data;
  let total = 0, count = 0;
  for (let i = 0; i < d.length; i += 32) { total += 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; count++; }
  return count > 0 ? total / count : 128;
};

const estimateHeadPose = (landmarks) => {
  const pts = landmarks.positions;
  const faceMidX   = (pts[39].x + pts[42].x) / 2;
  const faceWidth  = Math.abs(pts[45].x - pts[36].x);
  const eyeMidY    = (pts[36].y + pts[45].y) / 2;
  const faceHeight = Math.abs(pts[8].y - eyeMidY);
  if (faceWidth < 5 || faceHeight < 5) return { turnedAway: false, lookingDown: false };
  return {
    turnedAway  : Math.abs(pts[30].x - faceMidX) / faceWidth > TURN_THRESHOLD,
    lookingDown : (pts[30].y - eyeMidY) / faceHeight > DOWN_THRESHOLD,
  };
};

/**
 * v3.0 Gaze estimation using 68-landmark eye corners.
 * Left eye  pts[36..41]: outer=36, inner=39, upper-lid midpoint = avg(37,38)
 * Right eye pts[42..47]: inner=42, outer=45, upper-lid midpoint = avg(43,44)
 * Iris proxy ratio near 0 = looking left, near 1 = looking right, ~0.5 = centre.
 */
const estimateGaze = (landmarks) => {
  const pts = landmarks.positions;
  const leftWidth  = Math.abs(pts[39].x - pts[36].x);
  const leftIrisX  = (pts[37].x + pts[38].x) / 2;
  const leftRatio  = leftWidth > 3 ? (leftIrisX - pts[36].x) / leftWidth : 0.5;

  const rightWidth = Math.abs(pts[45].x - pts[42].x);
  const rightIrisX = (pts[43].x + pts[44].x) / 2;
  const rightRatio = rightWidth > 3 ? (rightIrisX - pts[42].x) / rightWidth : 0.5;

  const avg = (leftRatio + rightRatio) / 2;
  return {
    lookingLeft  : avg < GAZE_SIDE_THRESHOLD,
    lookingRight : avg > (1 - GAZE_SIDE_THRESHOLD),
    gazeRatio    : avg,
  };
};

/**
 * v3.0 Camera cover detection.
 * Pixel std-dev below threshold = nearly uniform frame = lens covered.
 */
const getFrameUniformity = (ctx, w, h) => {
  const d = ctx.getImageData(0,0,w,h).data;
  const samples = [];
  for (let i = 0; i < d.length; i += 64) samples.push(0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]);
  if (!samples.length) return 128;
  const mean = samples.reduce((a,b)=>a+b,0) / samples.length;
  const variance = samples.reduce((a,b)=>a+(b-mean)**2,0) / samples.length;
  return Math.sqrt(variance);
};

/**
 * v3.0 Mobile / secondary device detection via bright rectangular blob analysis.
 * Looks for screen-like (bright + saturated) clusters in the background.
 */
const detectMobileDevice = (ctx, w, h) => {
  const sw = 64, sh = 48;
  const d = ctx.getImageData(0,0,w,h).data;
  let minX=sw, maxX=0, minY=sh, maxY=0, bright=0;
  for (let gy=0; gy<sh; gy++) {
    for (let gx=0; gx<sw; gx++) {
      const px=Math.floor((gx/sw)*w), py=Math.floor((gy/sh)*h);
      const idx=(py*w+px)*4;
      const lum=0.299*d[idx]+0.587*d[idx+1]+0.114*d[idx+2];
      const max=Math.max(d[idx],d[idx+1],d[idx+2]);
      const min=Math.min(d[idx],d[idx+1],d[idx+2]);
      const sat=max>0?(max-min)/max:0;
      if (lum>180 && (sat>0.3||lum>220)) {
        bright++;
        if(gx<minX)minX=gx; if(gx>maxX)maxX=gx;
        if(gy<minY)minY=gy; if(gy>maxY)maxY=gy;
      }
    }
  }
  const bW=maxX-minX, bH=maxY-minY, bA=bW*bH;
  const wf=bW/sw, hf=bH/sh, fill=bA>0?bright/bA:0;
  return {
    detected: wf>0.08 && hf>0.08 && wf<0.80 && hf<0.80 && fill>0.50 && bright>30,
    widthFraction: wf, heightFraction: hf, brightCount: bright,
  };
};

const captureSnapshot = (canvas) => {
  try {
    const s=document.createElement('canvas'); s.width=160; s.height=120;
    s.getContext('2d').drawImage(canvas,0,0,160,120);
    return s.toDataURL('image/jpeg',0.55);
  } catch { return null; }
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
const useCameraProctoring = ({
  submissionId,
  onViolation,
  onCriticalViolation,
  onWarning,
  enabled = true,
  debugMode = false,
}) => {
  const [status,             setStatus]             = useState('idle');
  const [faceStatus,         setFaceStatus]         = useState('ok');
  const [lastEvent,          setLastEvent]           = useState(null);
  const [violationCount,     setViolationCount]     = useState(0);
  const [streak,             setStreak]             = useState(0);
  const [brightness,         setBrightness]         = useState(128);
  const [faceConfidence,     setFaceConfidence]     = useState(null);
  const [noFaceWarningCount, setNoFaceWarningCount] = useState(0);
  const [gazeStatus,         setGazeStatus]         = useState('center');

  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const overlayRef      = useRef(null);
  const streamRef       = useRef(null);
  const scanTimerRef    = useRef(null);
  const previewTimerRef = useRef(null);   // briefing-page lightweight scan
  const activeRef       = useRef(false);
  const runScanRef      = useRef(null);

  const stateRef = useRef({
    consecutiveNoFace      : 0,
    consecutiveEyeClosed   : 0,
    consecutiveGazeAway    : 0,
    consecutiveCoverFrames : 0,
    noFaceWarningCount     : 0,
    violationCount         : 0,
    lastViolationTime      : {},
    currentScanInterval    : SCAN_INTERVAL_OK,
    lastMobileDetectTime   : 0,
  });

  const canLog = (type) => {
    const last = stateRef.current.lastViolationTime[type] || 0;
    return Date.now() - last > (VIOLATION_COOLDOWN[type] || 10000);
  };

  const drawDebugOverlay = useCallback((detections) => {
    if (!debugMode || !overlayRef.current) return;
    const ctx = overlayRef.current.getContext('2d');
    ctx.clearRect(0,0,160,120);
    detections.forEach(({ detection, landmarks }) => {
      const sx=160/VIDEO_WIDTH, sy=120/VIDEO_HEIGHT, box=detection.box;
      ctx.strokeStyle='#00ff00'; ctx.lineWidth=1.5;
      ctx.strokeRect(box.x*sx, box.y*sy, box.width*sx, box.height*sy);
      if (landmarks) {
        ctx.fillStyle='#00ccff';
        landmarks.positions.forEach(pt => { ctx.beginPath(); ctx.arc(pt.x*sx,pt.y*sy,1.2,0,Math.PI*2); ctx.fill(); });
      }
    });
  }, [debugMode]);

  // Full violation — counts, triggers callbacks
  const recordCamViolation = useCallback((type, meta={}, canvas=null) => {
    if (!canLog(type)) return;
    stateRef.current.lastViolationTime[type] = Date.now();
    stateRef.current.violationCount++;
    setViolationCount(c => c+1);
    const snapshot = canvas ? captureSnapshot(canvas) : null;
    const entry = {
      id        : `cam-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      type,
      severity  : CAM_SEVERITY[type] || 'WARNING',
      label     : CAM_LABELS[type]   || type,
      timestamp : new Date().toISOString(),
      source    : 'camera',
      snapshot,
      ...meta,
    };
    setLastEvent(entry);
    if (entry.severity === 'WARNING') onWarning?.(entry);
    onViolation?.(entry);
    // Fire onCriticalViolation for every CRITICAL-severity camera event.
    // Previous list was missing MULTIPLE_FACES which is also CRITICAL severity.
    // Using severity check ensures future CRITICAL types are also covered.
    if (entry.severity === 'CRITICAL') {
      onCriticalViolation?.(entry);
    }
    if (submissionId) {
      logEvent({
        submission_id : submissionId,
        event_type    : type,
        severity      : entry.severity,
        details       : { label: entry.label, source: 'camera', snapshot: snapshot || null, ...meta },
        timestamp     : entry.timestamp,
      }).catch(() => {});
    }
  }, [submissionId, onViolation, onCriticalViolation, onWarning]);

  // Soft warning — logged to API as WARNING, does NOT increment violation count
  const recordCamWarning = useCallback((type, meta={}, canvas=null) => {
    if (!canLog(type)) return;
    stateRef.current.lastViolationTime[type] = Date.now();
    const snapshot = canvas ? captureSnapshot(canvas) : null;
    const entry = {
      id           : `cam-warn-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      type,
      severity     : 'WARNING',
      label        : CAM_LABELS[type] || type,
      timestamp    : new Date().toISOString(),
      source       : 'camera',
      isWarningOnly: true,
      snapshot,
      ...meta,
    };
    setLastEvent(entry);
    onWarning?.(entry);
    if (submissionId) {
      logEvent({
        submission_id : submissionId,
        event_type    : type,
        severity      : 'WARNING',
        details       : { label: entry.label, source: 'camera', isWarningOnly: true, ...meta },
        timestamp     : entry.timestamp,
      }).catch(() => {});
    }
  }, [submissionId, onWarning]);

  const scheduleNextScan = useCallback((inViolation) => {
    clearInterval(scanTimerRef.current);
    if (!activeRef.current) return;
    const interval = inViolation ? SCAN_INTERVAL_VIOLATION : SCAN_INTERVAL_OK;
    stateRef.current.currentScanInterval = interval;
    scanTimerRef.current = setInterval(() => runScanRef.current?.(), interval);
  }, []);

  const runScan = useCallback(async () => {
    if (!activeRef.current) return;
    const video=videoRef.current, canvas=canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState < 2 || video.videoWidth === 0) return;

    try {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

      // ── v3.0 Camera cover check (before dark check) ──────────────────────────
      const uniformity = getFrameUniformity(ctx, VIDEO_WIDTH, VIDEO_HEIGHT);
      if (uniformity < COVER_UNIFORMITY_THRESHOLD) {
        stateRef.current.consecutiveCoverFrames++;
        if (stateRef.current.consecutiveCoverFrames >= COVER_FRAMES_REQUIRED) {
          setFaceStatus('covered');
          recordCamViolation(CAM_VIOLATION.CAMERA_COVERED, { uniformity: uniformity.toFixed(2) }, canvas);
          scheduleNextScan(true);
          return;
        }
      } else {
        stateRef.current.consecutiveCoverFrames = 0;
      }

      // ── Darkness check ───────────────────────────────────────────────────────
      const lum = getFrameLuminance(ctx, VIDEO_WIDTH, VIDEO_HEIGHT);
      setBrightness(Math.round(lum));
      if (lum < DARK_THRESHOLD) {
        setFaceStatus('dark');
        stateRef.current.consecutiveNoFace++;
        recordCamViolation(CAM_VIOLATION.CAMERA_DARK, { luminance: Math.round(lum) }, canvas);
        scheduleNextScan(true);
        return;
      }

      // ── v3.0 Mobile device detection (throttled) ─────────────────────────────
      const now = Date.now();
      if (now - stateRef.current.lastMobileDetectTime > MOBILE_DETECT_INTERVAL) {
        stateRef.current.lastMobileDetectTime = now;
        const mob = detectMobileDevice(ctx, VIDEO_WIDTH, VIDEO_HEIGHT);
        if (mob.detected) {
          recordCamViolation(CAM_VIOLATION.MOBILE_DETECTED, {
            blob_width_pct  : (mob.widthFraction * 100).toFixed(1),
            blob_height_pct : (mob.heightFraction * 100).toFixed(1),
            bright_pixels   : mob.brightCount,
          }, canvas);
        }
      }

      // ── Face detection ───────────────────────────────────────────────────────
      const detections = await faceapi
        .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: FACE_API_INPUT_SIZE, scoreThreshold: DETECTION_THRESHOLD }))
        .withFaceLandmarks(true);

      if (debugMode) drawDebugOverlay(detections);

      const count = detections.length;
      let inViolation = false;

      // ── No face ─────────────────────────────────────────────────────────────
      if (count === 0) {
        setFaceStatus('no_face');
        setFaceConfidence(null);
        stateRef.current.consecutiveNoFace++;
        const warnCount = stateRef.current.noFaceWarningCount;

        if (warnCount < NO_FACE_WARNING_LIMIT) {
          // First 1-2 absences → soft warning only
          stateRef.current.noFaceWarningCount++;
          setNoFaceWarningCount(stateRef.current.noFaceWarningCount);
          recordCamWarning(CAM_VIOLATION.NO_FACE_WARNING, {
            warning_number : stateRef.current.noFaceWarningCount,
            warnings_left  : NO_FACE_WARNING_LIMIT - stateRef.current.noFaceWarningCount,
          }, canvas);
        } else {
          // 3rd+ → actual violation
          recordCamViolation(CAM_VIOLATION.NO_FACE_DETECTED, {
            consecutive   : stateRef.current.consecutiveNoFace,
            prior_warnings: warnCount,
          }, canvas);
          if (stateRef.current.consecutiveNoFace >= CONSECUTIVE_NO_FACE_CRITICAL) {
            onCriticalViolation?.({
              type    : CAM_VIOLATION.NO_FACE_DETECTED,
              reason  : `No face for ${stateRef.current.consecutiveNoFace} consecutive scans`,
              severity: 'CRITICAL',
            });
          }
        }

        setStreak(s => s+1);
        scheduleNextScan(true);
        return;
      }

      stateRef.current.consecutiveNoFace = 0;

      // ── Multiple faces ───────────────────────────────────────────────────────
      if (count > 1) {
        setFaceStatus('multiple');
        setFaceConfidence(null);
        recordCamViolation(CAM_VIOLATION.MULTIPLE_FACES, { face_count: count }, canvas);
        setStreak(s => s+1);
        scheduleNextScan(true);
        return;
      }

      // ── Single face checks ───────────────────────────────────────────────────
      const { detection, landmarks } = detections[0];
      const conf = Math.round(detection.score * 100);
      const box  = detection.box;
      const faceArea = (box.width * box.height) / (VIDEO_WIDTH * VIDEO_HEIGHT);
      setFaceConfidence(conf);

      if (detection.score < 0.55) {
        setFaceStatus('obscured');
        recordCamViolation(CAM_VIOLATION.FACE_OBSCURED, { confidence: conf }, canvas);
        inViolation = true;
      }

      if (faceArea < FACE_MIN_AREA_PCT) {
        setFaceStatus('too_small');
        recordCamViolation(CAM_VIOLATION.FACE_TOO_SMALL, { face_area_pct: (faceArea*100).toFixed(1) }, canvas);
        inViolation = true;
      }

      const pose = estimateHeadPose(landmarks);
      const pts  = landmarks.positions;
      const avgEAR = (eyeAspectRatio(pts,36) + eyeAspectRatio(pts,42)) / 2;

      if (avgEAR < EAR_THRESHOLD) {
        stateRef.current.consecutiveEyeClosed++;
        if (stateRef.current.consecutiveEyeClosed >= EYE_CLOSED_FRAMES) {
          setFaceStatus('eyes_closed');
          recordCamViolation(CAM_VIOLATION.EYES_CLOSED, { ear: avgEAR.toFixed(3) }, canvas);
          inViolation = true;
        }
      } else {
        stateRef.current.consecutiveEyeClosed = 0;
      }

      // ── v3.0 Gaze / eyeball tracking ─────────────────────────────────────────
      // Only run if eyes are open and head is not severely turned
      if (avgEAR >= EAR_THRESHOLD && !pose.turnedAway) {
        const gaze = estimateGaze(landmarks);
        if (gaze.lookingLeft || gaze.lookingRight) {
          stateRef.current.consecutiveGazeAway++;
          const dir = gaze.lookingLeft ? 'left' : 'right';
          setGazeStatus(dir);
          if (stateRef.current.consecutiveGazeAway >= GAZE_FRAMES_REQUIRED) {
            recordCamViolation(CAM_VIOLATION.GAZE_AWAY, {
              direction  : dir,
              gaze_ratio : gaze.gazeRatio.toFixed(3),
              ear        : avgEAR.toFixed(3),
            }, canvas);
            inViolation = true;
          }
        } else {
          stateRef.current.consecutiveGazeAway = 0;
          setGazeStatus('center');
        }
      }

      if (pose.lookingDown && !inViolation) {
        setFaceStatus('down');
        recordCamViolation(CAM_VIOLATION.FACE_LOOKING_DOWN, {}, canvas);
        inViolation = true;
      } else if (pose.turnedAway && !inViolation) {
        setFaceStatus('away');
        recordCamViolation(CAM_VIOLATION.FACE_TURNED_AWAY, {}, canvas);
        inViolation = true;
      }

      if (!inViolation) { setFaceStatus('ok'); setStreak(0); }
      else { setStreak(s => s+1); }

      scheduleNextScan(inViolation);

    } catch (err) {
      if (import.meta.env.DEV) console.error('[CameraProctoring] runScan error:', err);
      scheduleNextScan(false);
    }
  }, [recordCamViolation, recordCamWarning, drawDebugOverlay, scheduleNextScan, onCriticalViolation, debugMode]);

  runScanRef.current = runScan;

  // ── Reactive stream attachment ───────────────────────────────────────────────
  useEffect(() => {
    const video=videoRef.current, stream=streamRef.current;
    if (!video || !stream || video.srcObject) return;
    video.srcObject = stream;
    video.play().catch(() => {});
  });

  // ── Request camera permission ────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (streamRef.current) return 'granted';
    try {
      setStatus('requesting');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:{ideal:VIDEO_WIDTH}, height:{ideal:VIDEO_HEIGHT}, facingMode:'user', frameRate:{ideal:15} },
        audio: false,
      });
      streamRef.current = stream;
      setStatus('idle');
      return 'granted';
    } catch (err) {
      if (import.meta.env.DEV) console.error('[CameraProctoring] requestPermission error:', err);
      if (err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError') { setStatus('denied'); return 'denied'; }
      setStatus('error');
      return 'error';
    }
  }, []);

  // ── Start camera + AI ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!enabled || activeRef.current) return;
    try {
      if (!streamRef.current) {
        setStatus('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width:{ideal:VIDEO_WIDTH}, height:{ideal:VIDEO_HEIGHT}, facingMode:'user', frameRate:{ideal:15} },
          audio: false,
        });
        streamRef.current = stream;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await new Promise(res => { videoRef.current.onloadedmetadata = res; });
        await videoRef.current.play();
      }

      setStatus('loading_models');
      await loadModels();

      // v3.0 — watch for OS-level camera revocation (track ending = camera covered/stolen)
      streamRef.current?.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          if (!activeRef.current) return;
          setFaceStatus('covered');
          if (submissionId) {
            logEvent({
              submission_id : submissionId,
              event_type    : CAM_VIOLATION.CAMERA_COVERED,
              severity      : 'CRITICAL',
              details       : { reason: 'stream_track_ended', label: CAM_LABELS[CAM_VIOLATION.CAMERA_COVERED] },
              timestamp     : new Date().toISOString(),
            }).catch(() => {});
          }
          onCriticalViolation?.({ type: CAM_VIOLATION.CAMERA_COVERED, severity: 'CRITICAL' });
        });
      });

      activeRef.current = true;
      setStatus('active');

      setTimeout(() => {
        runScanRef.current?.();
        scanTimerRef.current = setInterval(() => runScanRef.current?.(), SCAN_INTERVAL_OK);
      }, 3000);

    } catch (err) {
      if (import.meta.env.DEV) console.error('[CameraProctoring] startCamera error:', err);
      if (err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError') {
        setStatus('denied');
        if (submissionId) logEvent({ submission_id:submissionId, event_type:'NO_FACE_DETECTED', severity:'CRITICAL', details:{reason:'camera_permission_denied'}, timestamp:new Date().toISOString() }).catch(()=>{});
      } else if (err?.message?.toLowerCase().includes('model')||err?.message?.includes('404')||err?.message?.includes('fetch')) {
        console.error('[CameraProctoring] Model files missing at /public/models/\n→ Run: node scripts/download-models.js', err);
        setStatus('model_error');
      } else {
        setStatus('error');
      }
    }
  }, [enabled, submissionId, onCriticalViolation]);

  // ── Stop camera ──────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    activeRef.current = false;
    clearInterval(scanTimerRef.current);
    clearInterval(previewTimerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
    setFaceStatus('ok');
  }, []);

  // ── Briefing-page preview scan (no violations logged, just face status) ──────
  // Called after camera permission is granted so student can verify position.
  const startPreviewScan = useCallback(async () => {
    clearInterval(previewTimerRef.current);
    if (!streamRef.current) return;
    try {
      // Attach stream to video element
      if (videoRef.current) {
        if (!videoRef.current.srcObject) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play().catch(() => {});
        }
      }
      // Load models (cached after first call)
      await loadModels();

      const scan = async () => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        try {
          const detections = await faceapi
            .detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions({
              inputSize: FACE_API_INPUT_SIZE,
              scoreThreshold: DETECTION_THRESHOLD,
            }));
          if      (detections.length === 0) setFaceStatus('no_face');
          else if (detections.length > 1)   setFaceStatus('multiple');
          else                              setFaceStatus('ok');
        } catch { setFaceStatus('no_face'); }
      };

      // Run immediately then every 2 s
      scan();
      previewTimerRef.current = setInterval(scan, 2000);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[CameraProctoring] startPreviewScan error:', err);
    }
  }, []);

  const stopPreviewScan = useCallback(() => {
    clearInterval(previewTimerRef.current);
    previewTimerRef.current = null;
    setFaceStatus('ok'); // reset to neutral when preview ends
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return {
    videoRef, canvasRef, overlayRef,
    status,
    isActive            : status === 'active',
    isPermissionGranted : status !== 'idle' || streamRef.current != null,
    faceStatus, lastEvent, violationCount, streak, brightness, faceConfidence,
    noFaceWarningCount,
    gazeStatus,
    noFaceWarningsRemaining : Math.max(0, NO_FACE_WARNING_LIMIT - noFaceWarningCount),
    requestPermission, startCamera, stopCamera,
    startPreviewScan, stopPreviewScan,
    SCAN_INTERVAL_OK, CAM_VIOLATION, CAM_LABELS,
  };
};

export default useCameraProctoring;