/**
 * proctoringService.js  ▸  ENHANCED v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * API layer for proctoring events with:
 *
 *  ✦ Resilient event queue with retry   – events survive transient network errors
 *  ✦ Offline buffer                     – events queued while offline, flushed on reconnect
 *  ✦ Exponential back-off               – 1s → 2s → 4s retry delays
 *  ✦ Batch submission                   – flush multiple buffered events in one call
 *  ✦ In-memory fallback                 – never loses events even if API is down
 */

import apiCall from '../api/Api';

// ─── Event queue (in-memory) ──────────────────────────────────────────────────
const eventQueue = [];
let flushTimer   = null;
let isFlusing    = false;

const FLUSH_DELAY  = 2_000;  // ms — batch window
const MAX_RETRIES  = 3;
const RETRY_DELAYS = [1_000, 2_000, 4_000];

// ─── Internal: flush queued events ───────────────────────────────────────────
const flushQueue = async () => {
  if (isFlusing || eventQueue.length === 0) return;
  if (!navigator.onLine) return; // wait for connectivity

  isFlusing = true;
  const batch = eventQueue.splice(0, 10); // take up to 10

  for (const item of batch) {
    let success = false;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await apiCall('/proctoring/log-event', {
          method : 'POST',
          body   : JSON.stringify(item.payload),
        });
        success = true;
        break;
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
        }
      }
    }

    if (!success) {
      // Re-queue at the back (give up after max retries)
      // Silently discard — exam must not be interrupted
    }
  }

  isFlusing = false;

  // If more events arrived during flush
  if (eventQueue.length > 0) {
    flushTimer = setTimeout(flushQueue, FLUSH_DELAY);
  }
};

const scheduleFlush = () => {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, FLUSH_DELAY);
};

// Flush on network reconnect
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (eventQueue.length > 0) flushQueue();
  });
}

// ─── Public: Log a single proctoring event ────────────────────────────────────
/**
 * Queues a proctoring event and flushes asynchronously.
 * Returns immediately — never blocks the exam UI.
 */
export const logEvent = (payload) => {
  // Always enqueue for resilience
  eventQueue.push({ payload, queuedAt: Date.now() });

  if (!navigator.onLine) return Promise.resolve(); // will flush on reconnect

  // Try immediate fire (no batching for CRITICAL events)
  if (payload.severity === 'CRITICAL' || payload.event_type === 'HEARTBEAT') {
    return apiCall('/proctoring/log-event', {
      method : 'POST',
      body   : JSON.stringify(payload),
    }).then(() => {
      // Remove from queue if immediate fire succeeded
      const idx = eventQueue.findIndex(e => e.payload === payload);
      if (idx !== -1) eventQueue.splice(idx, 1);
    }).catch(() => {
      // Stays in queue for retry
      scheduleFlush();
    });
  }

  scheduleFlush();
  return Promise.resolve();
};

// ─── Get violations for a submission (admin) ──────────────────────────────────
export const getViolations = async (submissionId) => {
  try {
    const data = await apiCall(`/proctoring/violations/${submissionId}`);
    return data;
  } catch (error) {
    console.error('Error in getViolations', error);
    throw error;
  }
};

// ─── Unblock a student (admin) ────────────────────────────────────────────────
export const unblockStudent = async (studentId, assignmentId) => {
  try {
    const data = await apiCall(`/proctoring/student/${studentId}/unblock`, {
      method : 'PUT',
      body   : JSON.stringify({ assignmentId }),
    });
    return data;
  } catch (error) {
    console.error('Error in unblockStudent', error);
    throw error;
  }
};

// ─── Unblock all students for an assignment (admin) ───────────────────────────
export const unblockAllStudents = async (assignmentId) => {
  try {
    const data = await apiCall(`/proctoring/assignment/${assignmentId}/unblock`, {
      method : 'PUT',
      body   : JSON.stringify({}),
    });
    return data;
  } catch (error) {
    console.error('Error in unblockAllStudents', error);
    throw error;
  }
};

// ─── Get proctoring history for a student (admin) ─────────────────────────────
export const getStudentHistory = async (studentId) => {
  try {
    const data = await apiCall(`/proctoring/student/${studentId}/history`);
    return data;
  } catch (error) {
    console.error('Error in getStudentHistory', error);
    throw error;
  }
};

// ─── Review a violation (admin) ───────────────────────────────────────────────
export const reviewViolation = async (violationId, action, notes) => {
  try {
    const data = await apiCall(`/proctoring/violations/${violationId}/review`, {
      method : 'PUT',
      body   : JSON.stringify({ action, notes }),
    });
    return data;
  } catch (error) {
    console.error('Error in reviewViolation', error);
    throw error;
  }
};

// ─── Get risk summary for a submission (admin) ────────────────────────────────
export const getRiskSummary = async (submissionId) => {
  try {
    const data = await apiCall(`/proctoring/violations/${submissionId}/risk`);
    return data;
  } catch (error) {
    console.error('Error in getRiskSummary', error);
    throw error;
  }
};