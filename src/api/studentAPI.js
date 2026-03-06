// src/api/studentAPI.js
// Real backend student API
// College Admin: /api/college-admin/students/*
// Super Admin:   /api/super-admin/students/*

import apiCall, { tokenStore } from './Api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const downloadFileFromEndpoint = async (endpoint, filename) => {
  const token = tokenStore.get();
  const res   = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

const uploadMultipart = async (endpoint, file, queryParams = {}) => {
  const token = tokenStore.get();
  const q = new URLSearchParams(Object.fromEntries(Object.entries(queryParams).filter(([,v]) => v))).toString();
  const url = `${API_URL}${endpoint}${q ? `?${q}` : ''}`;
  const form = new FormData();
  form.append('studentsFile', file);
  const res  = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, credentials: 'include', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
  return data;
};

const buildQS = (params) =>
  new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== '' && v != null))).toString();

export const collegeAdminStudentAPI = {
  // ── Fetch ──────────────────────────────────────────────────────
  getStudents: (params = {}) => {
    const q = buildQS(params);
    return apiCall(`/college-admin/students${q ? `?${q}` : ''}`);
  },

  // ── Manual Add ─────────────────────────────────────────────────
  // POST /api/college-admin/students
  // Body: { fullName, email, rollNumber, branch, semester, cgpa, batch, phone }
  // Password is auto-generated on backend (req 1.5)
  addStudent: (data) =>
    apiCall('/college-admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // POST /api/college-admin/students/bulk-form
  // Body: { students: [...] }  — array of student objects (no password needed)
  addStudents: (students) =>
    apiCall('/college-admin/students/bulk-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    }),

  // ── Export ─────────────────────────────────────────────────────
  getExportPreview: (params = {}) => {
    const q = buildQS(params);
    return apiCall(`/college-admin/students/export/preview${q ? `?${q}` : ''}`);
  },
  exportStudents: (params = {}) => {
    const q = buildQS(params);
    const fmt = params.format || 'xlsx';
    return downloadFileFromEndpoint(`/college-admin/students/export${q ? `?${q}` : ''}`, `students_export_${Date.now()}.${fmt}`);
  },

  // ── Bulk File Upload ────────────────────────────────────────────
  downloadTemplate: () => downloadFileFromEndpoint('/college-admin/students/bulk/template', 'student_bulk_upload_template.xlsx'),
  validateBulkUpload: (file) => uploadMultipart('/college-admin/students/bulk/validate', file),
  bulkUpload: (file) => uploadMultipart('/college-admin/students/bulk/upload', file),

  // ── Bulk JSON Upload (Excel parsed on frontend) ─────────────────
  // rows: array of raw row objects from xlsx parsing
  validateBulkUploadJSON: (rows) =>
    apiCall('/college-admin/students/bulk/validate-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    }),
  bulkUploadJSON: (rows) =>
    apiCall('/college-admin/students/bulk/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    }),
};

export const superAdminStudentAPI = {
  // ── Manual Add ─────────────────────────────────────────────────
  addStudent: (data) =>
    apiCall('/super-admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  addStudents: (students, collegeId = null) =>
    apiCall('/super-admin/students/bulk-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students, ...(collegeId ? { collegeId } : {}) }),
    }),

  // ── Export ─────────────────────────────────────────────────────
  getExportPreview: (params = {}) => {
    const q = buildQS(params);
    return apiCall(`/super-admin/students/export/preview${q ? `?${q}` : ''}`);
  },
  exportStudents: (params = {}) => {
    const q = buildQS(params);
    const fmt = params.format || 'xlsx';
    return downloadFileFromEndpoint(`/super-admin/students/export${q ? `?${q}` : ''}`, `students_export_${Date.now()}.${fmt}`);
  },

  // ── Bulk File Upload ────────────────────────────────────────────
  downloadTemplate: () => downloadFileFromEndpoint('/super-admin/students/bulk/template', 'student_bulk_upload_template.xlsx'),
  validateBulkUpload: (file, collegeId = null) => uploadMultipart('/super-admin/students/bulk/validate', file, collegeId ? { collegeId } : {}),
  bulkUpload: (file, collegeId = null) => uploadMultipart('/super-admin/students/bulk/upload', file, collegeId ? { collegeId } : {}),

  // ── Bulk JSON Upload (Excel parsed on frontend) ─────────────────
  validateBulkUploadJSON: (rows, collegeId = null) =>
    apiCall(`/super-admin/students/bulk/validate-json${collegeId ? `?collegeId=${collegeId}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    }),
  bulkUploadJSON: (rows, collegeId = null) =>
    apiCall(`/super-admin/students/bulk/upload-json${collegeId ? `?collegeId=${collegeId}` : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    }),

  getColleges: () => apiCall('/super-admin/colleges?limit=100'),
};

export default collegeAdminStudentAPI;