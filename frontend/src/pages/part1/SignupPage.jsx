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
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '' });
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    const updated = { ...form, [key]: value };
    setForm(updated);
    if (key === 'password') {
      setPwError(value && !PW_REGEX.test(value)
        ? '영문, 숫자, 특수문자(!@#$ 등)를 모두 포함하여 8자 이상 입력해주세요.' : '');
      setConfirmError(updated.confirmPassword && value !== updated.confirmPassword
        ? '비밀번호가 일치하지 않습니다.' : '');
    }
    if (key === 'confirmPassword') {
      setConfirmError(value && value !== updated.password
        ? '비밀번호가 일치하지 않습니다.' : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!PW_REGEX.test(form.password)) {
      setPwError('영문, 숫자, 특수문자(!@#$ 등)를 모두 포함하여 8자 이상 입력해주세요.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
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
                           : '#ffe0d0'
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
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: 64, borderColor: pwError ? '#e53e3e' : '#ffe0d0' }}
                type={showPw ? 'text' : 'password'}
                placeholder="비밀번호 (영문+숫자+특수문자, 8자 이상)"
                value={form.password}
                onChange={set('password')}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                {showPw ? '숨기기' : '표시'}
              </button>
            </div>
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
          <div>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: 64, borderColor: confirmError ? '#e53e3e' : '#ffe0d0' }}
                type={showConfirm ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                required
              />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? '숨기기' : '표시'}
              </button>
            </div>
            {confirmError && <p style={styles.error}>{confirmError}</p>}
          </div>
          <input style={styles.input} type="text" placeholder="이름" value={form.name} onChange={set('name')} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.btn} type="submit">가입하기</button>
        </form>
        <p style={styles.link}>이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #fff9f5 0%, #ffe8db 100%)' },
  card: { background: '#fff', borderRadius: 20, padding: 40, width: 420, boxShadow: '0 8px 40px rgba(255,107,53,0.12)' },
  title: { textAlign: 'center', marginBottom: 24, fontSize: 24, fontWeight: 900, color: '#2d1b0e' },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '13px 16px', border: '2px solid #ffe0d0', borderRadius: 14, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
  btn: { padding: 14, background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 4, fontFamily: 'inherit' },
  error: { color: '#e53e3e', fontSize: 13 },
  hint:   { fontSize: 12, marginTop: 4, marginBottom: 0 },
  eyeBtn: { position: 'absolute', right: 0, top: 0, bottom: 0, padding: '0 14px', border: 'none', background: 'transparent', color: '#b08070', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  link: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#7c5a4a' },
};
