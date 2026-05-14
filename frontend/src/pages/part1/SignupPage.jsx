import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, checkEmail } from '../../api';

const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function getPasswordStrength(pw) {
  if (!pw) return null;
  const hasLetter  = /[A-Za-z]/.test(pw);
  const hasNumber  = /\d/.test(pw);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);
  const isLong     = pw.length >= 8;
  const score = [hasLetter, hasNumber, hasSpecial, isLong].filter(Boolean).length;
  if (score <= 2) return { label: '약함', color: '#e53e3e' };
  if (score === 3) return { label: '보통', color: '#d97706' };
  return { label: '강함', color: '#16a34a' };
}

export default function SignupPage({ onSignup }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', studentNo: '', department: '' });
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  // null | 'checking' | 'available' | 'taken'
  const [emailStatus, setEmailStatus] = useState(null);

  // 이메일 입력 후 500ms 뒤 중복 확인
  useEffect(() => {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !EMAIL_RE.test(form.email)) {
      setEmailStatus(null);
      return;
    }
    setEmailStatus('checking');
    const timer = setTimeout(() => {
      checkEmail(form.email)
        .then(res => setEmailStatus(res.data.available ? 'available' : 'taken'))
        .catch(() => setEmailStatus(null));
    }, 500);
    return () => clearTimeout(timer);
  }, [form.email]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm({ ...form, [key]: value });
    if (key === 'password') {
      if (value && !PW_REGEX.test(value)) {
        setPwError('영문, 숫자, 특수문자(!@#$ 등)를 모두 포함하여 8자 이상 입력해주세요.');
      } else {
        setPwError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!PW_REGEX.test(form.password)) {
      setPwError('영문, 숫자, 특수문자(!@#$ 등)를 모두 포함하여 8자 이상 입력해주세요.');
      return;
    }
    if (emailStatus === 'taken') {
      setError('이미 사용 중인 이메일입니다.');
      return;
    }
    try {
      const res = await signup(form);
      onSignup(res.data);
      navigate('/tags');
    } catch (err) {
      setError(err.response?.data?.error || '회원가입 중 오류가 발생했습니다.');
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>회원가입</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <input
              style={{
                ...styles.input, width: '100%', boxSizing: 'border-box',
                borderColor: emailStatus === 'available' ? '#16a34a'
                           : emailStatus === 'taken'     ? '#e53e3e'
                           : emailStatus === 'checking'  ? '#d97706'
                           : '#ddd'
              }}
              type="email"
              placeholder="이메일"
              value={form.email}
              onChange={set('email')}
              required
            />
            {emailStatus === 'checking'  && <p style={{ ...styles.hint, color: '#d97706' }}>확인 중...</p>}
            {emailStatus === 'available' && <p style={{ ...styles.hint, color: '#16a34a' }}>✓ 사용 가능한 이메일입니다.</p>}
            {emailStatus === 'taken'     && <p style={{ ...styles.hint, color: '#e53e3e' }}>✗ 이미 사용 중인 이메일입니다.</p>}
          </div>
          <div>
            <input
              style={{ ...styles.input, width: '100%', boxSizing: 'border-box', borderColor: pwError ? '#e53e3e' : '#ddd' }}
              type="password"
              placeholder="비밀번호 (영문+숫자+특수문자, 8자 이상)"
              value={form.password}
              onChange={set('password')}
              required
            />
            {strength && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#e5e7eb' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: strength.label === '약함' ? '33%' : strength.label === '보통' ? '66%' : '100%',
                    background: strength.color, transition: 'width 0.3s'
                  }} />
                </div>
                <span style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
              </div>
            )}
            {pwError && <p style={styles.error}>{pwError}</p>}
          </div>
          <input style={styles.input} type="text"    placeholder="이름"    value={form.name}       onChange={set('name')}       required />
          <input style={styles.input} type="text"    placeholder="학번"    value={form.studentNo}  onChange={set('studentNo')} />
          <input style={styles.input} type="text"    placeholder="학과"    value={form.department} onChange={set('department')} />
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
  hint:  { fontSize: 12, marginTop: 4, marginBottom: 0 },
  link: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#666' },
};
