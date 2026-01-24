import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global 401 handler: clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.clear();
      } catch (_) {
        // ignore storage errors
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Kiosk endpoints
export const kioskApi = {
  getUsers: () => api.get('/kiosk/users'),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: (reflectionText) => 
    api.post('/attendance/check-out', { reflectionText }),
  getReflectionPrompt: () => api.get('/kiosk/reflection-prompt'),
};

// User endpoints
export const userApi = {
  getAll: (role) => api.get('/users', { params: { role } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, updates) => api.patch(`/users/${id}`, updates),
  updateAlias: (id, alias) => api.patch(`/users/${id}/alias`, { alias }),
  updatePin: (id, pin) => api.patch(`/users/${id}/pin`, { pin }),
  delete: (id) => api.delete(`/users/${id}`),
};

// Presence endpoints
export const presenceApi = {
  getCurrent: () => api.get('/presence/current'),
};

// Attendance endpoints
export const attendanceApi = {
  getByRange: (startDate, endDate, userIds) => 
    api.get('/attendance/range', { params: { start_date: startDate, end_date: endDate, user_ids: userIds?.join(',') } }),
  adminCreate: (data) => api.post('/attendance/admin', data),
  adminUpdate: (sessionId, data) => api.patch(`/attendance/${sessionId}/admin`, data),
  adminDelete: (sessionId, auditReason) => api.delete(`/attendance/${sessionId}`, { data: { auditReason } }),
  getMyHistory: () => api.get('/attendance/me/history'),
  getTimeline: (date) => api.get('/attendance/timeline', { params: { date } }),
  // Pass client timezone offset to ensure correct local-day window on server
  getTimelineWithTz: (date) => 
    api.get('/attendance/timeline', { 
      params: { date, tzOffsetMinutes: new Date().getTimezoneOffset() }
    }),
  getByDay: (date) => api.get('/attendance/day', { params: { date } }),
  getByUser: (userId) => api.get(`/attendance/user/${userId}`),
  getUserStatus: (userId) => api.get(`/attendance/user/${userId}/status`),
  getCurrentStatus: () => api.get('/attendance/me'),
  correctSession: (sessionId, updates) => 
    api.patch(`/attendance/${sessionId}`, updates),
  createManual: (data) => api.post('/attendance', data),
  quickCheckIn: (userId, checkInTime, auditReason) => 
    api.post(`/attendance/user/${userId}/quick-checkin`, { checkInTime, auditReason }),
  quickCheckOut: (userId, checkOutTime, auditReason) => 
    api.post(`/attendance/user/${userId}/quick-checkout`, { checkOutTime, auditReason }),
  export: (startDate, endDate) => 
    api.get('/attendance/export', { 
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
    }),
  getLeaderboard: (limit = 10) =>
    api.get('/attendance/leaderboard', { params: { limit } }),
};

// Absence endpoints
export const absenceApi = {
  getMine: (startDate, endDate) => api.get('/absences/me', { params: { startDate, endDate } }),
};

// Contact endpoints
export const contactApi = {
  getByUserId: (userId) => api.get(`/users/${userId}/contacts`),
  getMyContacts: () => api.get('/contacts/me'),
  create: (userId, contactData) => 
    api.post(`/users/${userId}/contacts`, contactData),
  createMyContact: (contactData) => api.post('/contacts/me', contactData),
  update: (contactId, updates) => 
    api.patch(`/contacts/${contactId}`, updates),
  delete: (contactId) => api.delete(`/contacts/${contactId}`),
};

// Reflection endpoints
export const reflectionApi = {
  getAll: () => api.get('/reflections'),
  getByUserId: (userId) => api.get(`/reflections/user/${userId}`),
};

// Settings endpoints
export const settingsApi = {
  get: () => api.get('/settings'),
  getPublic: () => api.get('/settings/public'),
  update: (payload) => 
    api.patch('/settings', payload),
};

// Slideshow endpoints
export const slideshowApi = {
  list: () => api.get('/slideshow/images'),
  upload: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/slideshow/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (filename) => api.delete(`/slideshow/images/${encodeURIComponent(filename)}`),
};

export default api;
