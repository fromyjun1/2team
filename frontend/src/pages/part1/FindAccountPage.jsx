import { useState } from 'react';
import { Link } from 'react-router-dom';
import { findEmail, changePassword } from '../../api';

const PW_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export default function FindAccountPage() {
  const [tab, setTab] = useState('email');

  // 아이디 찾기
  const [findForm, setFindForm]   = useState({ name: '', studentNo: '' });
  const [foundEmail, setFoundEmail] = useState('');
  const [findError, setFindError] = useState('');

  // 비밀번호 변경
  const [pwForm, setPwForm]   = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleFindEmail = async (e) => {
    e.preventDefault();
    setFindError('');
    setFoundEmail('');
    try {
      const res = await findEmail(findForm.name, findForm.studentNo);
      setFoundEmail(res.data.email);
    } catch (err) {
      setFindError(err.response?.data?.error || '일치하는 정보를 찾을 수 없습니다.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!PW_REGEX.test(pwForm.newPassword)) {
      setPwError('영문, 숫자, 특수문자를 모두 포함하여 8자 이상 입력해주세요.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await changePassword(pwForm.email, pwForm.newPassword);
      setPwSuccess(true);
    } catch (err) {
      setPwError(err.response?.data?.error || '비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>계정 찾기</h2>

        {/* 탭 */}
        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(tab === 'email' ? styles.tabActive : {}) }}
            onClick={() => { setTab('email'); setFoundEmail(''); setFindError(''); }}
          >
            아이디 찾기
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'password' ? styles.tabActive : {}) }}
            onClick={() => { setTab('password'); setPwSuccess(false); setPwError(''); }}
          >
            비밀번호 변경
          </button>
        </div>

        {/* 아이디 찾기 */}
        {tab === 'email' && (
          foundEmail ? (
            <div style={styles.resultBox}>
              <p style={styles.resultLabel}>가입된 이메일</p>
              <p style={styles.resultEmail}>{foundEmail}</p>
              <Link to="/login" style={styles.linkBtn}>로그인하러 가기</Link>
            </div>
          ) : (
            <form onSubmit={handleFindEmail} style={styles.form}>
              <p style={styles.desc}>가입 시 입력한 이름과 학번을 입력해주세요.</p>
              <label style={styles.label}>이름</label>
              <input
                style={styles.input}
                type="text"
                placeholder="이름 입력"
                value={findForm.name}
                onChange={(e) => setFindForm({ ...findForm, name: e.target.value })}
                required
              />
              <label style={styles.label}>학번</label>
              <input
                style={styles.input}
                type="text"
                placeholder="학번 입력"
                value={findForm.studentNo}
                onChange={(e) => setFindForm({ ...findForm, studentNo: e.target.value })}
                required
              />
              {findError && <p style={styles.error}>{findError}</p>}
              <button style={styles.btn} type="submit">아이디 찾기</button>
            </form>
          )
        )}

        {/* 비밀번호 변경 */}
        {tab === 'password' && (
          pwSuccess ? (
            <div style={styles.resultBox}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>✓</p>
              <p style={styles.resultLabel}>비밀번호가 변경되었습니다.</p>
              <Link to="/login" style={styles.linkBtn}>로그인하러 가기</Link>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} style={styles.form}>
              <p style={styles.desc}>가입된 이메일과 새 비밀번호를 입력해주세요.</p>
              <label style={styles.label}>이메일</label>
              <input
                style={styles.input}
                type="email"
                placeholder="가입한 이메일"
                value={pwForm.email}
                onChange={(e) => setPwForm({ ...pwForm, email: e.target.value })}
                required
              />
              <label style={styles.label}>새 비밀번호</label>
              <input
                style={styles.input}
                type="password"
                placeholder="영문+숫자+특수문자, 8자 이상"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                required
              />
              <label style={styles.label}>비밀번호 확인</label>
              <input
                style={styles.input}
                type="password"
                placeholder="비밀번호 재입력"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                required
              />
              {pwError && <p style={styles.error}>{pwError}</p>}
              <button style={styles.btn} type="submit">비밀번호 변경</button>
            </form>
          )
        )}

        <p style={styles.bottom}>
          <Link to="/login">로그인</Link> · <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container:   { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' },
  card:        { background: '#fff', borderRadius: 12, padding: '36px 40px', width: 380, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title:       { textAlign: 'center', marginBottom: 20, fontSize: 20, color: '#333' },
  tabRow:      { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24 },
  tab:         { flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#888' },
  tabActive:   { color: '#4f46e5', fontWeight: 700, borderBottom: '2px solid #4f46e5', marginBottom: -2 },
  form:        { display: 'flex', flexDirection: 'column', gap: 8 },
  desc:        { fontSize: 13, color: '#888', margin: '0 0 8px', lineHeight: 1.5 },
  label:       { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 4 },
  input:       { padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  btn:         { marginTop: 8, padding: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  error:       { color: '#e53e3e', fontSize: 13, margin: 0 },
  resultBox:   { textAlign: 'center', padding: '20px 0' },
  resultLabel: { color: '#888', fontSize: 14, marginBottom: 8 },
  resultEmail: { fontSize: 20, fontWeight: 700, color: '#4f46e5', marginBottom: 24 },
  linkBtn:     { display: 'inline-block', padding: '10px 28px', background: '#4f46e5', color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none' },
  bottom:      { textAlign: 'center', marginTop: 20, fontSize: 13, color: '#aaa' },
};
