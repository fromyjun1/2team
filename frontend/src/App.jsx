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
import AdminPage        from './pages/admin/AdminPage';

import RecommendPage  from './pages/part3/RecommendPage';
import WishlistPage   from './pages/part3/WishlistPage';

import ApplicationPage  from './pages/part4/ApplicationPage';
import QnaPage          from './pages/part4/QnaPage';
import NoticePage       from './pages/part4/NoticePage';
import MemberBoardPage  from './pages/part4/MemberBoardPage';

// ── 네비게이션 바 ─────────────────────────────────
function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

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

