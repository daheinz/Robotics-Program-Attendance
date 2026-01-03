import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  getByDay: (date) => api.get('/attendance/day', { params: { date } }),
  getByUser: (userId) => api.get(`/attendance/user/${userId}`),
  getCurrentStatus: () => api.get('/attendance/me'),
  correctSession: (sessionId, updates) => 
    api.patch(`/attendance/${sessionId}`, updates),
  createManual: (data) => api.post('/attendance', data),
  export: (startDate, endDate) => 
    api.get('/attendance/export', { 
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob',
    }),
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
  update: (reflectionPrompt) => 
    api.patch('/settings', { reflectionPrompt }),
};

export default api;
