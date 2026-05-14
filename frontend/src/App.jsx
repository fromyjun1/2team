import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';

import { getMe } from './api';
import LoginPage      from './pages/part1/LoginPage';
import SignupPage     from './pages/part1/SignupPage';
import TagSelectPage  from './pages/part1/TagSelectPage';
import MyPage         from './pages/part1/MyPage';

import ClubGalleryPage  from './pages/part2/ClubGalleryPage';
import ClubDetailPage   from './pages/part2/ClubDetailPage';
import AdminClubForm    from './pages/part2/AdminClubForm';

import RecommendPage  from './pages/part3/RecommendPage';
import WishlistPage   from './pages/part3/WishlistPage';

import ApplicationPage from './pages/part4/ApplicationPage';
import QnaPage         from './pages/part4/QnaPage';

// ── 네비게이션 바 ─────────────────────────────────
function Navbar({ user, onLogout }) {
  return (
    <nav style={nav.bar}>
      <Link to="/" style={nav.logo}>🎓 동아리 매칭</Link>
      <div style={nav.links}>
        <Link to="/clubs" style={nav.link}>동아리 탐색</Link>
        <Link to="/recommend" style={nav.link}>추천 받기</Link>
        <Link to="/wishlist" style={nav.link}>찜 목록</Link>
        <Link to="/applications" style={nav.link}>신청 현황</Link>
        {user?.role === 'ADMIN' && <Link to="/admin" style={nav.link}>관리자</Link>}
      </div>
      <div style={nav.right}>
        {user ? (
          <>
            <Link to="/mypage" style={nav.link}>{user.name}님</Link>
            <button style={nav.btn} onClick={onLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login" style={nav.link}>로그인</Link>
            <Link to="/signup" style={{ ...nav.link, ...nav.signupBtn }}>회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ── 인증 가드 ─────────────────────────────────────
function PrivateRoute({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#4f46e5', fontSize: 16 }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={{ paddingTop: 64 }}>
        <Routes>
          {/* 공개 라우트 */}
          <Route path="/login"  element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
          <Route path="/clubs"  element={<ClubGalleryPage />} />
          <Route path="/clubs/:clubId" element={<ClubDetailPage userId={user?.userId} />} />

          {/* 로그인 필요 */}
          <Route path="/" element={<PrivateRoute user={user}><Navigate to="/recommend" replace /></PrivateRoute>} />
          <Route path="/tags"    element={<PrivateRoute user={user}><TagSelectPage userId={user?.userId} /></PrivateRoute>} />
          <Route path="/mypage"  element={<PrivateRoute user={user}><MyPage user={user} /></PrivateRoute>} />
          <Route path="/recommend" element={<PrivateRoute user={user}><RecommendPage userId={user?.userId} /></PrivateRoute>} />
          <Route path="/wishlist"  element={<PrivateRoute user={user}><WishlistPage userId={user?.userId} /></PrivateRoute>} />
          <Route path="/applications" element={<PrivateRoute user={user}><ApplicationPage userId={user?.userId} /></PrivateRoute>} />
          <Route path="/clubs/:clubId/qna" element={<PrivateRoute user={user}><QnaPage userId={user?.userId} /></PrivateRoute>} />

          {/* 관리자 */}
          <Route path="/admin" element={<PrivateRoute user={user}><AdminClubForm /></PrivateRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const nav = {
  bar: { position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 32, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  logo: { fontWeight: 700, fontSize: 18, color: '#4f46e5', textDecoration: 'none', marginRight: 8 },
  links: { display: 'flex', gap: 20, flex: 1 },
  link: { color: '#555', fontSize: 14, textDecoration: 'none' },
  right: { display: 'flex', gap: 12, alignItems: 'center' },
  btn: { padding: '6px 14px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 },
  signupBtn: { background: '#4f46e5', color: '#fff', padding: '6px 14px', borderRadius: 6 },
};
