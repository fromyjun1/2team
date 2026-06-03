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

// 401 응답 시 자동 로그아웃 후 로그인 페이지로 이동
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── 파트 1: 사용자 ──────────────────────────────
export const signup = (data) => api.post('/users/signup', data);
export const login  = (data) => api.post('/users/login', data);
export const getMe          = ()             => api.get('/users/me');
export const checkEmail     = (email)        => api.get('/users/check-email', { params: { email } });
export const findEmail      = (name, studentNo) => api.get('/users/find-email', { params: { name, studentNo } });
export const sendVerification = (email) => api.post('/users/send-verification', { email });
export const changePassword = (email, code, newPassword) => api.put('/users/change-password', { email, code, newPassword });
export const changePasswordLoggedIn = (userId, currentPassword, newPassword) =>
  api.patch(`/users/${userId}/password`, { currentPassword, newPassword });
export const getTags    = (userId) => api.get(`/users/${userId}/tags`);
export const updateTags = (userId, tags) => api.put(`/users/${userId}/tags`, tags);
export const getProfile = (userId) => api.get(`/users/${userId}/profile`);
export const updateProfile = (userId, studentNo, department, certificateFile) => {
  const form = new FormData();
  if (studentNo)       form.append('studentNo', studentNo);
  if (department)      form.append('department', department);
  if (certificateFile) form.append('certificate', certificateFile);
  return api.put(`/users/${userId}/profile`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ── 알림 ────────────────────────────────────────
export const getNotifications = ()   => api.get('/notifications');
export const getUnreadCount   = ()   => api.get('/notifications/unread-count');
export const markNotifRead    = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotifRead = ()   => api.patch('/notifications/read-all');

// ── 파트 2: 동아리 ──────────────────────────────
export const getClubs        = (category) => api.get('/clubs', { params: { category } });
export const getClub         = (clubId)   => api.get(`/clubs/${clubId}`);
export const getCreatedClubs = (userId)   => api.get(`/clubs/created-by/${userId}`);
export const createClub = (data)     => api.post('/clubs', data);
export const updateClub = (clubId, data) => api.put(`/clubs/${clubId}`, data);
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
export const updateQna      = (qnaId, data)    => api.put(`/qna/${qnaId}`, data);
export const deleteQna      = (qnaId)          => api.delete(`/qna/${qnaId}`);

export const getMemberCount = (clubId)        => api.get(`/applications/club/${clubId}/count`);
export const leaveClub      = (clubId)        => api.delete(`/applications/club/${clubId}/leave`);
export const reapply        = (data)          => api.post('/applications/reapply', data);

export const getNotices     = (clubId)        => api.get(`/notices/club/${clubId}`);
export const createNotice   = (data)          => api.post('/notices', data);
export const deleteNotice   = (noticeId)      => api.delete(`/notices/${noticeId}`);

export const getMemberPosts  = (clubId)       => api.get(`/member-posts/club/${clubId}`);
export const createMemberPost = (data)        => api.post('/member-posts', data);
export const createMemberReply = (parentId, data) => api.post(`/member-posts/${parentId}/reply`, data);
export const deleteMemberPost  = (postId)     => api.delete(`/member-posts/${postId}`);

// ── 관리자 ──────────────────────────────────
export const getAdminStats        = ()             => api.get('/admin/stats');
export const getAdminUsers        = ()             => api.get('/admin/users');
export const changeUserRole       = (userId, role) => api.patch(`/admin/users/${userId}/role`, { role });
export const getAdminClubs        = ()             => api.get('/admin/clubs');
export const deactivateClub       = (clubId)       => api.delete(`/admin/clubs/${clubId}`);
export const deleteClubPermanent  = (clubId)       => api.delete(`/admin/clubs/${clubId}/permanent`);
export const getAdminApplications = ()             => api.get('/admin/applications');
