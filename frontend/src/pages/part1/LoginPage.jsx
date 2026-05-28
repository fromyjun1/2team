import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>동아리 매칭 시스템</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="이메일"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="비밀번호"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">로그인</button>
        </form>
        <div style={styles.subLinks}>
          <Link to="/find-account">아이디 찾기</Link>
          <span style={{ color: '#ddd' }}>|</span>
          <Link to="/find-account">비밀번호 변경</Link>
        </div>
        <p style={styles.link}>
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: 360, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', marginBottom: 24, fontSize: 22, color: '#333' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  btn: { padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  error: { color: '#e53e3e', fontSize: 13, margin: 0 },
  subLinks: { display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, fontSize: 13, color: '#888' },
  link: { textAlign: 'center', marginTop: 12, fontSize: 13, color: '#666' },
};
