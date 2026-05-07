// src/api/groupAPI.js
// ─────────────────────────────────────────────────────────────────────────────
// Real API calls to /api/group endpoints (college_admin + super_admin access)
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token helper (mirrors Api.js pattern) ────────────────────────────────────
let _accessToken = null;
export const groupTokenStore = {
  get: () => {
    // Try to read from the shared module-level store in Api.js via window ref
    // Api.js exposes tokenStore but we avoid a circular dep by reading from
    // the same in-memory variable set by Api.js via a shared approach.
    // Fallback: attempt localStorage for legacy support (should remain null normally).
    return _accessToken;
  },
  set: (t) => { _accessToken = t; },
};

// Keep in sync with the main tokenStore from Api.js
if (typeof window !== 'undefined') {
  // Patch: mirror token from Api.js tokenStore by hooking into auth events
  window.addEventListener('auth:tokenSet', (e) => {
    _accessToken = e.detail?.token || null;
  });
}

// ── Generic API call ─────────────────────────────────────────────────────────
const call = async (endpoint, options = {}) => {
  // Prefer token from Api.js tokenStore (accessed via import if possible)
  let token = _accessToken;
  // Fallback: read from the global tokenStore if Api.js attached it
  if (!token && typeof window !== 'undefined' && window.__tokenStore) {
    token = window.__tokenStore.get?.();
  }

  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Error ${response.status}`);
  return data;
};

// ── Group API ─────────────────────────────────────────────────────────────────
export const groupAPI = {
  /** GET /api/group — all active groups for the signed-in admin's college */
  getGroups: () => call('/group'),

  /** GET /api/group/dropdown — lightweight { _id, name, student_count } list */
  getGroupsDropdown: () => call('/group/dropdown'),

  /** GET /api/group/:id */
  getGroupById: (id) => call(`/group/${id}`),

  /** GET /api/group/:id/students */
  getGroupStudents: (id) => call(`/group/${id}/students`),

  /** POST /api/group — { name, description?, students?: [{ userId }] } */
  createGroup: (data) =>
    call('/group', { method: 'POST', body: JSON.stringify(data) }),

  /** PUT /api/group/:id — full update (name, description, students, status) */
  updateGroup: (id, data) =>
    call(`/group/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  /** PATCH /api/group/:id/add-students — { students: [{ userId }] } */
  addStudents: (id, students) =>
    call(`/group/${id}/add-students`, {
      method: 'PATCH',
      body: JSON.stringify({ students }),
    }),

  /** PATCH /api/group/:id/remove-students — { userIds: [string] } */
  removeStudents: (id, userIds) =>
    call(`/group/${id}/remove-students`, {
      method: 'PATCH',
      body: JSON.stringify({ userIds }),
    }),

  /** DELETE /api/group/:id — soft delete (status → inactive) */
  deleteGroup: (id) => call(`/group/${id}`, { method: 'DELETE' }),
};

// Alias for super admin (same endpoints, role-checked server-side)
export const superAdminGroupAPI = groupAPI;

export default groupAPI;