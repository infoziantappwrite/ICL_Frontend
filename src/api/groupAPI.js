// src/api/groupAPI.js
// ─────────────────────────────────────────────────────────────────────────────
// NOTE: The backend has NO /groups endpoints.
// This file is kept only so existing imports don't break.
// All functions are NO-OPS that return empty data immediately.
// All student operations go through studentAPI.js instead.
// ─────────────────────────────────────────────────────────────────────────────

const noGroups = () => Promise.resolve({ data: [], groups: [], students: [] });
const noOp     = () => Promise.resolve({ success: false, message: 'Groups not available' });

export const groupAPI = {
  getGroups:        noGroups,
  createGroup:      noOp,
  getGroupById:     noOp,
  updateGroup:      noOp,
  deleteGroup:      noOp,
  getGroupStudents: noGroups,
  addStudent:       noOp,
  updateStudent:    noOp,
  removeStudent:    noOp,
  importStudents:   noOp,
  bulkAddStudents:  noOp,
  exportStudents:   noGroups,
};

export const superAdminGroupAPI = {
  getGroups:        noGroups,
  createGroup:      noOp,
  updateGroup:      noOp,
  deleteGroup:      noOp,
  getGroupStudents: noGroups,
  bulkAddStudents:  noOp,
  updateStudent:    noOp,
  deleteStudent:    noOp,
  getSubscription:  noOp,
  updateSubscription: noOp,
};

// Keep window references so any stray code doesn't crash
if (typeof window !== 'undefined') {
  window.groupAPI          = groupAPI;
  window.superAdminGroupAPI = superAdminGroupAPI;
}

export default groupAPI;