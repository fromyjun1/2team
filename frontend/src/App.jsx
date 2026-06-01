import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

import { getMe } from './api';
import LoginPage       from './pages/part1/LoginPage';
import SignupPage      from './pages/part1/SignupPage';
import TagSelectPage   from './pages/part1/TagSelectPage';
import MyPage          from './pages/part1/MyPage';
import FindAccountPage from './pages/part1/FindAccountPage';

import ClubGalleryPage  from './pages/part2/ClubGalleryPage';
import ClubDetailPage   from './pages/part2/ClubDetailPage';
import CreateClubPage   from './pages/part2/CreateClubPage';
import ClubManagePage   from './pages/part2/ClubManagePage';
import AdminClubForm    from './pages/part2/AdminClubForm';

import RecommendPage  from './pages/part3/RecommendPage';
import WishlistPage   from './pages/part3/WishlistPage';

import ApplicationPage from './pages/part4/ApplicationPage';
import QnaPage         from './pages/part4/QnaPage';

// ── 네비게이션 바 ─────────────────────────────────
function Navbar({ user, onLogout }) {
  return (
    <nav style={nav.bar}>
      <Link to="/" style={nav.logo}>🎯 동아리 매칭</Link>
      <div style={nav.links}>
        <Link to="/clubs" style={nav.link}>동아리 탐색</Link>
        <Link to="/recommend" style={nav.link}>추천 받기</Link>
        <Link to="/wishlist" style={nav.link}>찜 목록</Link>
        <Link to="/applications" style={nav.link}>신청 현황</Link>
        {user && <Link to="/clubs/new" style={nav.link}>동아리 만들기</Link>}
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
          <Route path="/clubs/:clubId/qna" element={<PrivateRoute user={user}><QnaPage userId={user?.userId} /></PrivateRoute>} />

          {/* 관리자 */}
          <Route path="/admin" element={<AdminRoute user={user}><AdminClubForm /></AdminRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const nav = {
  bar: { position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: '#fff', boxShadow: '0 2px 12px rgba(255,120,60,0.08)', display: 'flex', alignItems: 'center', padding: '0 40px', gap: 32, zIndex: 100 },
  logo: { fontWeight: 900, fontSize: 20, color: '#ff6b35', textDecoration: 'none', marginRight: 8 },
  links: { display: 'flex', gap: 28, flex: 1 },
  link: { color: '#7c5a4a', fontSize: 14, textDecoration: 'none', fontWeight: 600 },
  right: { display: 'flex', gap: 10, alignItems: 'center' },
  btn: { padding: '8px 18px', border: '2px solid #ff6b35', borderRadius: 100, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#ff6b35', fontWeight: 700 },
  signupBtn: { background: '#ff6b35', color: '#fff', padding: '8px 18px', borderRadius: 100, border: 'none', fontWeight: 700 },
};
