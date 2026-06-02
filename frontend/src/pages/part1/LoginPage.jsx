import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login({ email: form.email, password: form.password });
      localStorage.setItem('user', JSON.stringify(res.data));
      onLogin(res.data);
      navigate('/recommend');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div style={styles.wrap}>
      {/* 왼쪽 소개 패널 */}
      <div style={styles.left} className="login-left">
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎯</div>
        <h2 style={styles.leftTitle}>동아리 매칭 🎯</h2>
        <p style={styles.leftDesc}>관심사 태그로 나와 맞는 동아리를 찾아보세요</p>
      </div>

      {/* 오른쪽 폼 */}
      <div style={styles.right} className="login-right">
        <div style={styles.card}>
          <div style={styles.title}>반갑습니다! 👋</div>
          <div style={styles.sub}>계정으로 로그인하세요</div>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.group}>
              <input
                style={styles.input}
                type="email"
                placeholder="📧 이메일"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={{ ...styles.group, position: 'relative' }}>
              <input
                style={{ ...styles.input, paddingRight: 72 }}
                type={showPw ? 'text' : 'password'}
                placeholder="🔒 비밀번호"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                {showPw ? '숨기기' : '표시'}
              </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            <button style={styles.btn} type="submit">로그인 →</button>
          </form>
          <div style={styles.subLinks}>
            <Link to="/find-account">아이디 찾기</Link>
            {' · '}
            <Link to="/find-account">비밀번호 변경</Link>
          </div>
          <div style={styles.divider}>── 또는 ──</div>
          <p style={styles.signupText}>
            처음이세요? <Link to="/signup" style={{ color: '#ff6b35', fontWeight: 800 }}>회원가입하기 →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #fff9f5 0%, #ffe8db 100%)' },
  left: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '60px', textAlign: 'center' },
  leftTitle: { fontSize: 36, fontWeight: 900, color: '#ff6b35', marginBottom: 12, letterSpacing: '-1px' },
  leftDesc: { fontSize: 16, color: '#7c5a4a', lineHeight: 1.8 },
  right: { width: 440, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 48px', background: '#fff' },
  card: { width: '100%' },
  title: { fontSize: 26, fontWeight: 900, marginBottom: 6, color: '#2d1b0e' },
  sub: { fontSize: 14, color: '#b08070', marginBottom: 32 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  group: { marginBottom: 0 },
  input: { width: '100%', padding: '13px 16px', border: '2px solid #ffe0d0', borderRadius: 14, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s' },
  btn: { width: '100%', padding: 14, background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' },
  error: { color: '#e53e3e', fontSize: 13, margin: 0 },
  eyeBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, padding: '0 14px', border: 'none', background: 'transparent', color: '#b08070', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  subLinks: { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16, fontSize: 13, color: '#b08070' },
  divider: { textAlign: 'center', margin: '16px 0', color: '#b08070', fontSize: 13 },
  signupText: { textAlign: 'center', fontSize: 13, color: '#7c5a4a' },
};
