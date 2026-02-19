// src/api/groupAPI.js
// Group & Student management API — uses the shared apiCall helper from Api.js
// so auth token, logging, and error handling are consistent with the rest of the app.

import apiCall from './Api';

// ─────────────────────────────────────────────
// COLLEGE ADMIN  →  /api/college-admin/groups
// ─────────────────────────────────────────────
export const groupAPI = {

  // ── Groups ────────────────────────────────
  getGroups: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/groups${qs ? `?${qs}` : ''}`);
  },

  createGroup: (data) =>
    apiCall('/college-admin/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGroupById: (groupId) =>
    apiCall(`/college-admin/groups/${groupId}`),

  updateGroup: (groupId, data) =>
    apiCall(`/college-admin/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGroup: (groupId) =>
    apiCall(`/college-admin/groups/${groupId}`, { method: 'DELETE' }),

  // ── Students within a group ───────────────
  getGroupStudents: (groupId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/groups/${groupId}/students${qs ? `?${qs}` : ''}`);
  },

  addStudent: (groupId, studentData) =>
    apiCall(`/college-admin/groups/${groupId}/students`, {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),

  updateStudent: (groupId, studentId, data) =>
    apiCall(`/college-admin/groups/${groupId}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  removeStudent: (groupId, studentId) =>
    apiCall(`/college-admin/groups/${groupId}/students/${studentId}`, {
      method: 'DELETE',
    }),

  // ── Bulk operations ───────────────────────
  /** importStudents — accepts an array of student objects (from Excel mapping).
   *  Backend matches by email: updates existing, creates new.
   *  Returns { added, updated, skipped }. */
  importStudents: (groupId, students) =>
    apiCall(`/college-admin/groups/${groupId}/import`, {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  /** bulkAddStudents — legacy bulk-create endpoint used by ExcelLikeGrid.
   *  Falls back to importStudents internally. */
  bulkAddStudents: (groupId, students) =>
    apiCall(`/college-admin/groups/${groupId}/students/bulk`, {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  /** exportStudents — returns the full student list as JSON for client-side
   *  XLSX conversion. */
  exportStudents: (groupId) =>
    apiCall(`/college-admin/groups/${groupId}/export`),
};

// ─────────────────────────────────────────────
// SUPER ADMIN  →  /api/super-admin/groups
// (requires the super-admin group routes on the backend — see INTEGRATION_GUIDE)
// ─────────────────────────────────────────────
export const superAdminGroupAPI = {

  // Groups scoped to a college
  getGroups: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/super-admin/groups${qs ? `?${qs}` : ''}`);
  },

  createGroup: (data) =>
    apiCall('/super-admin/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGroup: (groupId, data) =>
    apiCall(`/super-admin/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGroup: (groupId) =>
    apiCall(`/super-admin/groups/${groupId}`, { method: 'DELETE' }),

  // Students
  getGroupStudents: (groupId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/super-admin/groups/${groupId}/students${qs ? `?${qs}` : ''}`);
  },

  bulkAddStudents: (groupId, students) =>
    apiCall(`/super-admin/groups/${groupId}/students/bulk`, {
      method: 'POST',
      body: JSON.stringify({ students }),
    }),

  updateStudent: (groupId, studentId, data) =>
    apiCall(`/super-admin/groups/${groupId}/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStudent: (groupId, studentId) =>
    apiCall(`/super-admin/groups/${groupId}/students/${studentId}`, {
      method: 'DELETE',
    }),

  // Subscription management (already exists on backend)
  getSubscription: (collegeId) =>
    apiCall(`/subscriptions/college/${collegeId}`),

  updateSubscription: (collegeId, payload) =>
    apiCall(`/subscriptions/college/${collegeId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

// Make both available globally so pages can use them without import if needed
window.groupAPI = groupAPI;
window.superAdminGroupAPI = superAdminGroupAPI;

export default groupAPI;