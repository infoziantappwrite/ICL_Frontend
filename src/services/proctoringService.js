// src/services/proctoringService.js
import apiCall from '../api/Api';

// Log a proctoring event (called in real-time by useProctoringGuard)
export const logEvent = async (payload) => {
  try {
    const data = await apiCall('/proctoring/log-event', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error) {
    console.error('Error in logEvent', error);
    throw error;
  }
};

// Get violations for a submission (admin)
export const getViolations = async (submissionId) => {
  try {
    const data = await apiCall(`/proctoring/violations/${submissionId}`);
    return data;
  } catch (error) {
    console.error('Error in getViolations', error);
    throw error;
  }
};

// Unblock a single student for an assignment (admin)
export const unblockStudent = async (studentId, assignmentId) => {
  try {
    const data = await apiCall(`/proctoring/student/${studentId}/unblock`, {
      method: 'PUT',
      body: JSON.stringify({ assignmentId }),
    });
    return data;
  } catch (error) {
    console.error('Error in unblockStudent', error);
    throw error;
  }
};

// Unblock all flagged students for an assignment (admin)
export const unblockAllStudents = async (assignmentId) => {
  try {
    const data = await apiCall(`/proctoring/assignment/${assignmentId}/unblock`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
    return data;
  } catch (error) {
    console.error('Error in unblockAllStudents', error);
    throw error;
  }
};

// Get proctoring history for a student (admin)
export const getStudentHistory = async (studentId) => {
  try {
    const data = await apiCall(`/proctoring/student/${studentId}/history`);
    return data;
  } catch (error) {
    console.error('Error in getStudentHistory', error);
    throw error;
  }
};

// Review and take action on a violation event (admin)
export const reviewViolation = async (violationId, action, notes) => {
  try {
    const data = await apiCall(`/proctoring/violations/${violationId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, notes }),
    });
    return data;
  } catch (error) {
    console.error('Error in reviewViolation', error);
    throw error;
  }
};