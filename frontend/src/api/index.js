import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// 요청마다 JWT 토큰 자동 주입
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.token) config.headers['Authorization'] = `Bearer ${user.token}`;
  return config;
});

// ── 파트 1: 사용자 ──────────────────────────────
export const signup = (data) => api.post('/users/signup', data);
export const login  = (data) => api.post('/users/login', data);
export const getMe       = ()      => api.get('/users/me');
export const checkEmail  = (email) => api.get('/users/check-email', { params: { email } });
export const getTags   = (userId) => api.get(`/users/${userId}/tags`);
export const updateTags = (userId, tags) => api.put(`/users/${userId}/tags`, tags);

// ── 파트 2: 동아리 ──────────────────────────────
export const getClubs   = (category) => api.get('/clubs', { params: { category } });
export const getClub    = (clubId) => api.get(`/clubs/${clubId}`);
export const createClub = (data)   => api.post('/clubs', data);
export const uploadClubImage = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/clubs/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const updateClubTags = (clubId, tags) => api.put(`/clubs/${clubId}/tags`, tags);

// ── 파트 3: 매칭 ──────────────────────────────
export const getRecommendations = (userId) => api.get(`/match/${userId}`);
export const addWishlist    = (userId, clubId) => api.post(`/match/${userId}/wishlist/${clubId}`);
export const removeWishlist = (userId, clubId) => api.delete(`/match/${userId}/wishlist/${clubId}`);
export const getWishlist    = (userId) => api.get(`/match/${userId}/wishlist`);

// ── 파트 4: 신청 & Q&A ──────────────────────────
export const applyClub          = (data)   => api.post('/applications', data);
export const getMyApplications  = (userId) => api.get(`/applications/user/${userId}`);
export const getClubApplications = (clubId) => api.get(`/applications/club/${clubId}`);
export const updateAppStatus    = (appId, status, comment) =>
  api.patch(`/applications/${appId}/status`, { status, comment });

export const getQnaList     = (clubId) => api.get(`/qna/club/${clubId}`);
export const createQuestion = (data)   => api.post('/qna', data);
export const createReply    = (parentId, data) => api.post(`/qna/${parentId}/reply`, data);
