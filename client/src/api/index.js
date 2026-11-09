import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  try {
    const profile = localStorage.getItem('profile');
    if (profile) {
      const token = JSON.parse(profile)?.token;
      if (token) req.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return req;
});

export const signUp = (formData) => API.post('/auth/register', formData);
export const signIn = (formData) => API.post('/auth/login', formData);

export const searchUsers = (q) => API.get('/users/search', { params: { q } });

export const getDms = () => API.get('/dms');
export const getDmRequests = () => API.get('/dms/requests');
export const startDm = (payload) => API.post('/dms/start', payload);
export const getDmMessages = (threadId) => API.get(`/dms/${threadId}/messages`);
export const sendDmMessage = (threadId, payload) => API.post(`/dms/${threadId}/messages`, payload);
export const acceptDmRequest = (threadId) => API.post(`/dms/${threadId}/accept`);
export const declineDmRequest = (threadId) => API.post(`/dms/${threadId}/decline`);

export const createInstantMeeting = (payload) => API.post('/meetings/instant', payload);
export const createScheduledMeeting = (payload) => API.post('/meetings/scheduled', payload);
export const getMeetings = () => API.get('/meetings');
export const getMeeting = (code) => API.get(`/meetings/${code}`);
export const joinMeeting = (code) => API.post(`/meetings/${code}/join`);
export const endMeeting = (code) => API.post(`/meetings/${code}/end`);
export const getMeetingMessages = (code) => API.get(`/meetings/${code}/messages`);
export const sendMeetingMessage = (code, payload) => API.post(`/meetings/${code}/messages`, payload);

export const getNotifications = () => API.get('/notifications');
export const readNotification = (id) => API.patch(`/notifications/${id}/read`);
export const readAllNotifications = () => API.post('/notifications/read-all');

// legacy compatibility
export const getConversations = getDms;
export const createConversation = (newConvo) => createInstantMeeting({ title: newConvo?.conversationName });
export const getUserConversation = getMeeting;
export const sendMessage = ({ convoId, message }) => sendMeetingMessage(convoId, { text: message });
export const addConversation = () => Promise.resolve({ data: { ok: true } });
