const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed.');
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed.');
    return data;
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve active session.');
    return data.user;
  },

  // Groups/Cohorts
  getGroups: async () => {
    const res = await fetch(`${API_URL}/groups`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve cohorts.');
    return data;
  },

  getGroupDetail: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to retrieve group details.');
    return data;
  },

  createGroup: async (groupData) => {
    const res = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(groupData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create group.');
    return data;
  },

  updateGroup: async (id, groupData) => {
    const res = await fetch(`${API_URL}/groups/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(groupData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update group.');
    return data;
  },

  deleteGroup: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete group.');
    return data;
  },

  assignStudent: async (groupId, studentId) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ studentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to assign student user.');
    return data;
  },

  unassignStudent: async (groupId, studentId) => {
    const res = await fetch(`${API_URL}/groups/${groupId}/unassign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ studentId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove student user.');
    return data;
  },

  joinGroup: async (id) => {
    const res = await fetch(`${API_URL}/groups/${id}/join`, {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join group.');
    return data;
  },

  // Activities Checklist
  getActivities: async (activeGroupId) => {
    const url = activeGroupId ? `${API_URL}/activities?groupId=${activeGroupId}` : `${API_URL}/activities`;
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch activities checklist.');
    return data;
  },

  getActivityDetail: async (id) => {
    const res = await fetch(`${API_URL}/activities/${id}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch activity details.');
    return data;
  },

  createActivity: async (activityData) => {
    const res = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(activityData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create activity.');
    return data;
  },

  updateActivity: async (id, activityData) => {
    const res = await fetch(`${API_URL}/activities/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(activityData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update activity order/details.');
    return data;
  },

  deleteActivity: async (id) => {
    const res = await fetch(`${API_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete activity.');
    return data;
  },

  updateActivityLog: async (id, status) => {
    const res = await fetch(`${API_URL}/activities/${id}/log`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log activity status.');
    return data;
  },

  // Content Repository
  getContents: async () => {
    const res = await fetch(`${API_URL}/content`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to list content items.');
    return data;
  },

  uploadContent: async (formData) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_URL}/content`, {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload/create content item.');
    return data;
  },

  deleteContent: async (id) => {
    const res = await fetch(`${API_URL}/content/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete content.');
    return data;
  },

  // Glossary Tagging
  getGlossaryTerms: async (contentId) => {
    const res = await fetch(`${API_URL}/glossary/content/${contentId}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch glossary tags.');
    return data;
  },

  createGlossaryTerm: async (termData) => {
    const res = await fetch(`${API_URL}/glossary`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(termData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save glossary term.');
    return data;
  },

  deleteGlossaryTerm: async (id) => {
    const res = await fetch(`${API_URL}/glossary/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete glossary term.');
    return data;
  },

  // Chat Interface
  getChatHistory: async (activityId) => {
    const res = await fetch(`${API_URL}/chat/${activityId}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch conversation history.');
    return data;
  },

  sendChatMessage: async (activityId, message) => {
    const res = await fetch(`${API_URL}/chat/${activityId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send chat message.');
    return data;
  },

  // Admin Logs & Statistics
  getStudents: async () => {
    const res = await fetch(`${API_URL}/admin/students`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch students roster.');
    return data;
  },

  getUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users list.');
    return data;
  },

  getAdminLogs: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_URL}/admin/logs?${params.toString()}`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch log details.');
    return data;
  },

  getAdminStats: async () => {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard metrics.');
    return data;
  }
};
