import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../../api';

export default function SignupPage({ onSignup }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', studentNo: '', department: '' });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await signup(form);
      onSignup(res.data);
      navigate('/tags');
    } catch (err) {
      setError(err.response?.data?.error || '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>회원가입</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} type="email"  placeholder="이메일"    value={form.email}      onChange={set('email')}      required />
          <input style={styles.input} type="password" placeholder="비밀번호 (6자 이상)" value={form.password} onChange={set('password')} minLength={6} required />
          <input style={styles.input} type="text"   placeholder="이름"      value={form.name}       onChange={set('name')}       required />
          <input style={styles.input} type="text"   placeholder="학번"      value={form.studentNo}  onChange={set('studentNo')} />
          <input style={styles.input} type="text"   placeholder="학과"      value={form.department} onChange={set('department')} />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">가입하기</button>
        </form>
        <p style={styles.link}>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', marginBottom: 24, fontSize: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  btn: { padding: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', marginTop: 4 },
  error: { color: '#e53e3e', fontSize: 13 },
  link: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#666' },
};
