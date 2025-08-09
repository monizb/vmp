import { apiClient } from './client';

export const queryKeys = {
  status: ['status'],
  users: ['users'],
  teams: ['teams'],
  apps: ['apps'],
  reports: ['reports'],
  vulns: ['vulns'],
};

export const statusApi = {
  get: () => apiClient.get('/status'),
};

export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.patch(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  getCurrent: () => apiClient.get('/me'),
};

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }),
};

export const teamsApi = {
  getAll: () => apiClient.get('/teams'),
  getById: (id) => apiClient.get(`/teams/${id}`),
  create: (data) => apiClient.post('/teams', data),
  update: (id, data) => apiClient.patch(`/teams/${id}`, data),
  delete: (id) => apiClient.delete(`/teams/${id}`),
  getByPlatform: (platform) => apiClient.get(`/teams/platform/${platform}`),
};

export const appsApi = {
  getAll: (filters = {}) => apiClient.get('/apps', filters),
  getById: (id) => apiClient.get(`/apps/${id}`),
  create: (data) => apiClient.post('/apps', data),
  update: (id, data) => apiClient.patch(`/apps/${id}`, data),
  delete: (id) => apiClient.delete(`/apps/${id}`),
  getByTeam: (teamId) => apiClient.get(`/apps/team/${teamId}`),
  getByPlatform: (platform) => apiClient.get(`/apps/platform/${platform}`),
};

export const reportsApi = {
  getAll: (filters = {}) => apiClient.get('/reports', filters),
  getById: (id) => apiClient.get(`/reports/${id}`),
  create: (data) => apiClient.post('/reports', data),
  update: (id, data) => apiClient.patch(`/reports/${id}`, data),
  delete: (id) => apiClient.delete(`/reports/${id}`),
  import: (data) => apiClient.post('/reports/import', data),
  getByApplication: (applicationId) => apiClient.get(`/reports/application/${applicationId}`),
  getByYear: (year) => apiClient.get(`/reports/year/${year}`),
  getReconfirmatory: (reportId) => apiClient.get(`/reports/${reportId}/reconfirmatory`),
  markAsParsed: (id, vulnerabilityIds) => apiClient.patch(`/reports/${id}/parse`, { vulnerabilityIds }),
};

export const vulnsApi = {
  getAll: (filters = {}) => apiClient.get('/vulns', filters),
  getById: (id) => apiClient.get(`/vulns/${id}`),
  create: (data) => apiClient.post('/vulns', data),
  update: (id, data) => apiClient.patch(`/vulns/${id}`, data),
  delete: (id) => apiClient.delete(`/vulns/${id}`),
  bulkCreate: (vulnerabilities) => apiClient.post('/vulns/bulk', { vulnerabilities }),
  getByApplication: (applicationId) => apiClient.get(`/vulns/application/${applicationId}`),
  getByReport: (reportId) => apiClient.get(`/vulns/report/${reportId}`),
  getByStatus: (status) => apiClient.get(`/vulns/status/${status}`),
  getBySeverity: (severity) => apiClient.get(`/vulns/severity/${severity}`),
  getByAssignee: (userId) => apiClient.get(`/vulns/assigned/${userId}`),
  getByYear: (year) => apiClient.get(`/vulns/year/${year}`),
  getOverdue: () => apiClient.get('/vulns/overdue'),
  getDueThisWeek: () => apiClient.get('/vulns/due-this-week'),
  getUpcomingRetests: () => apiClient.get('/vulns/upcoming-retests'),
  getStats: () => apiClient.get('/vulns/stats'),
}; 

export const viewsApi = {
  getAll: (filters = {}) => apiClient.get('/views', filters),
  create: (data) => apiClient.post('/views', data),
  update: (id, data) => apiClient.patch(`/views/${id}`, data),
  delete: (id) => apiClient.delete(`/views/${id}`),
};

export const settingsApi = {
  getDueDateSettings: () => apiClient.get('/settings/due-dates'),
  updateDueDateSettings: (data) => apiClient.patch('/settings/due-dates', data),
};