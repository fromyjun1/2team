import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import { getMe, getNotifications, getUnreadCount, markNotifRead, markAllNotifRead } from './api';
import LoginPage       from './pages/part1/LoginPage';
import SignupPage      from './pages/part1/SignupPage';
import TagSelectPage   from './pages/part1/TagSelectPage';
import MyPage          from './pages/part1/MyPage';
import FindAccountPage from './pages/part1/FindAccountPage';

import ClubGalleryPage  from './pages/part2/ClubGalleryPage';
import ClubDetailPage   from './pages/part2/ClubDetailPage';
import CreateClubPage   from './pages/part2/CreateClubPage';
import ClubManagePage   from './pages/part2/ClubManagePage';
import AdminPage        from './pages/admin/AdminPage';

import RecommendPage  from './pages/part3/RecommendPage';
import WishlistPage   from './pages/part3/WishlistPage';

import ApplicationPage  from './pages/part4/ApplicationPage';
import QnaPage          from './pages/part4/QnaPage';
import NoticePage       from './pages/part4/NoticePage';
import MemberBoardPage  from './pages/part4/MemberBoardPage';

// ── 네비게이션 바 ─────────────────────────────────
function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifications, setNotifs]    = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const close = () => setMenuOpen(false);

  const fetchNotifs = () => {
    if (!user) return;
    getUnreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    if (notifOpen) getNotifications().then(r => setNotifs(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!user) { setUnreadCount(0); setNotifs([]); return; }
    getUnreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    const timer = setInterval(() => {
      getUnreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});
    }, 30000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (!notifOpen || !user) return;
    getNotifications().then(r => setNotifs(r.data)).catch(() => {});
  }, [notifOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n) => {
    if (!n.isRead) markNotifRead(n.id).then(() => {
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount(c => Math.max(0, c - 1));
    }).catch(() => {});
    if (n.link) window.location.href = n.link;
    setNotifOpen(false);
  };

  const handleMarkAll = () => {
    markAllNotifRead().then(() => {
      setNotifs(prev => prev.map(x => ({ ...x, isRead: true })));
      setUnreadCount(0);
    }).catch(() => {});
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)   return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <>
      <nav className="nav-bar">
        <Link to="/" className="nav-logo" onClick={close}>🎯 동아리 매칭</Link>
        <div className="nav-links">
          <Link to="/clubs" className="nav-link">동아리 탐색</Link>
          <Link to="/recommend" className="nav-link">추천 받기</Link>
          <Link to="/wishlist" className="nav-link">찜 목록</Link>
          <Link to="/applications" className="nav-link">신청 현황</Link>
          {user && <Link to="/clubs/new" className="nav-link">동아리 만들기</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin" className="nav-link">관리자</Link>}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              {/* 알림 벨 */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setNotifOpen(o => !o)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, position: 'relative', padding: '4px 8px' }}
                  aria-label="알림"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0,
                      background: '#ef4444', color: '#fff',
                      borderRadius: '50%', fontSize: 10, fontWeight: 700,
                      width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 320, background: '#fff', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 200,
                    overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>알림</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAll} style={{ background: 'none', border: 'none', fontSize: 12, color: '#ff6b35', cursor: 'pointer', fontWeight: 600 }}>
                          전체 읽음
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>알림이 없습니다</div>
                      ) : notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          style={{
                            padding: '12px 16px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start',
                            background: n.isRead ? '#fff' : '#fff9f5',
                            borderBottom: '1px solid #f5f5f5',
                          }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>
                            {n.type === 'APPLICATION_APPROVED' ? '✅' : n.type === 'APPLICATION_REJECTED' ? '❌' : '🔔'}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#2d1b0e', fontWeight: n.isRead ? 400 : 600, lineHeight: 1.4 }}>{n.message}</p>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#aaa' }}>{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6b35', flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/mypage" className="nav-link">{user.name}님</Link>
              <button className="nav-btn" onClick={onLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">로그인</Link>
              <Link to="/signup" className="nav-signup">회원가입</Link>
            </>
          )}
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="메뉴">
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>
      <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
        <Link to="/clubs" onClick={close}>동아리 탐색</Link>
        <Link to="/recommend" onClick={close}>추천 받기</Link>
        <Link to="/wishlist" onClick={close}>찜 목록</Link>
        <Link to="/applications" onClick={close}>신청 현황</Link>
        {user && <Link to="/clubs/new" onClick={close}>동아리 만들기</Link>}
        {user?.role === 'ADMIN' && <Link to="/admin" onClick={close}>관리자</Link>}
        {user ? (
          <>
            <Link to="/mypage" onClick={close}>{user.name}님</Link>
            <button className="nav-mobile-logout" onClick={() => { onLogout(); close(); }}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={close}>로그인</Link>
            <Link to="/signup" className="nav-mobile-signup" onClick={close}>회원가입</Link>
          </>
        )}
      </div>
    </>
  );
}

// ── 인증 가드 ─────────────────────────────────────
function PrivateRoute({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
}

function ProfileRequiredRoute({ user, children }) {
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.studentNo || !user.department) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '48px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ marginBottom: 12, color: '#2d1b0e', fontSize: 20, fontWeight: 800 }}>학생 정보를 입력해주세요</h2>
          <p style={{ color: '#7c5a4a', lineHeight: 1.7, marginBottom: 28, fontSize: 14 }}>
            추천받기, 찜 목록, 신청 현황 기능은<br />학번·학과 정보 입력 후 이용하실 수 있습니다.
          </p>
          <button
            onClick={() => navigate('/mypage?tab=profile')}
            style={{ padding: '12px 32px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            정보 입력하러 가기
          </button>
        </div>
      </div>
    );
  }
  return children;
}

// ── 앱 루트 ──────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = (() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();

    if (stored?.token) {
      getMe()
        .then(res => {
          const refreshed = { ...res.data, token: stored.token };
          localStorage.setItem('user', JSON.stringify(refreshed));
          setUser(refreshed);
        })
        .catch(() => {
          // 토큰 만료 또는 유효하지 않으면 자동 로그아웃
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin  = (u) => { localStorage.setItem('user', JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem('user'); setUser(null); };
  const refreshUser  = () => {
    const stored = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
    if (!stored?.token) return;
    getMe().then(res => {
      const refreshed = { ...res.data, token: stored.token };
      localStorage.setItem('user', JSON.stringify(refreshed));
      setUser(refreshed);
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fff9f5' }}>
        <div style={{ color: '#ff6b35', fontSize: 16, fontWeight: 700 }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={{ paddingTop: 64 }}>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login"        element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup"       element={<SignupPage onSignup={handleLogin} />} />
          <Route path="/find-account" element={<FindAccountPage />} />
          <Route path="/clubs"  element={<ClubGalleryPage />} />
          <Route path="/clubs/:clubId" element={<ClubDetailPage userId={user?.userId} />} />
          <Route path="/clubs/new" element={<PrivateRoute user={user}><CreateClubPage /></PrivateRoute>} />
          <Route path="/clubs/:clubId/manage" element={<PrivateRoute user={user}><ClubManagePage user={user} /></PrivateRoute>} />

          {/* 로그인 필요 */}
          <Route path="/" element={<PrivateRoute user={user}><Navigate to="/recommend" replace /></PrivateRoute>} />
          <Route path="/tags"    element={<PrivateRoute user={user}><TagSelectPage userId={user?.userId} /></PrivateRoute>} />
          <Route path="/mypage"  element={<PrivateRoute user={user}><MyPage user={user} onProfileSaved={refreshUser} /></PrivateRoute>} />
          <Route path="/recommend" element={<ProfileRequiredRoute user={user}><RecommendPage userId={user?.userId} /></ProfileRequiredRoute>} />
          <Route path="/wishlist"  element={<ProfileRequiredRoute user={user}><WishlistPage userId={user?.userId} /></ProfileRequiredRoute>} />
          <Route path="/applications" element={<ProfileRequiredRoute user={user}><ApplicationPage userId={user?.userId} /></ProfileRequiredRoute>} />
          <Route path="/clubs/:clubId/qna"     element={<PrivateRoute user={user}><QnaPage user={user} /></PrivateRoute>} />
          <Route path="/clubs/:clubId/notices" element={<PrivateRoute user={user}><NoticePage user={user} /></PrivateRoute>} />
          <Route path="/clubs/:clubId/board"   element={<PrivateRoute user={user}><MemberBoardPage user={user} /></PrivateRoute>} />

          {/* 관리자 */}
          <Route path="/admin" element={<AdminRoute user={user}><AdminPage /></AdminRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

