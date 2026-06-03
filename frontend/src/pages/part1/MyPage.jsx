import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTags, getMyApplications, getWishlist, getProfile, updateProfile, changePasswordLoggedIn, getClub, getCreatedClubs } from '../../api';

export default function MyPage({ user, onProfileSaved }) {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'profile' ? 'profile' : 'info');

  // 내 정보 탭 데이터
  const [tags, setTags]           = useState([]);
  const [apps, setApps]           = useState([]);
  const [wishlist, setWishlist]   = useState([]);
  const [myClubs, setMyClubs]     = useState([]);

  // 비밀번호 변경 탭 데이터
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false });
  const [pwMsg, setPwMsg]     = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // 학생 정보 탭 데이터
  const [profile, setProfile]       = useState({ studentNo: '', department: '', certificatePath: '' });
  const [certFile, setCertFile]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState('');
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    getTags(user.userId).then((r) => setTags(r.data)).catch(() => {});
    getMyApplications(user.userId).then(async (r) => {
      setApps(r.data);
      const approved = r.data.filter((a) => a.status === 'APPROVED');
      const memberClubs = await Promise.all(
        approved.map((a) => getClub(a.clubId).then((res) => ({ ...res.data, isOwner: false })).catch(() => null))
      );
      const createdClubs = await getCreatedClubs(user.userId)
        .then((res) => res.data.map((c) => ({ ...c, isOwner: true })))
        .catch(() => []);
      const createdIds = new Set(createdClubs.map((c) => c.clubId));
      const merged = [...createdClubs, ...memberClubs.filter(Boolean).filter((c) => !createdIds.has(c.clubId))];
      setMyClubs(merged);
    }).catch(() => {});
    getWishlist(user.userId).then((r) => setWishlist(r.data)).catch(() => {});
    getProfile(user.userId).then((r) => {
      setProfile({
        studentNo:       r.data.studentNo       || '',
        department:      r.data.department      || '',
        certificatePath: r.data.certificatePath || '',
      });
      if (r.data.studentNo && r.data.department) setSaved(true);
    }).catch(() => {});
  }, [user]);

  // URL 파라미터로 탭 변경 시 반영
  useEffect(() => {
    if (searchParams.get('tab') === 'profile') setTab('profile');
  }, [searchParams]);

  const STATUS = {
    PENDING:  { label: '검토 중', color: '#f59e0b' },
    APPROVED: { label: '승인',    color: '#10b981' },
    REJECTED: { label: '거절',    color: '#ef4444' },
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await updateProfile(user.userId, profile.studentNo, profile.department, certFile);
      setSaveMsg('저장되었습니다.');
      setCertFile(null);
      setSaved(true);
      if (onProfileSaved) onProfileSaved();
    } catch {
      setSaveMsg('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 프로필 헤더 */}
      <div style={styles.header}>
        <div style={styles.avatar}>{user?.name?.[0]}</div>
        <div>
          <h2 style={{ margin: 0 }}>{user?.name}</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>{user?.email}</p>
        </div>
      </div>

      {/* 탭 */}
      <div style={styles.tabBar}>
        <button style={tab === 'info'     ? styles.tabActive : styles.tab} onClick={() => setTab('info')}>내 정보</button>
        <button style={tab === 'myclubs'  ? styles.tabActive : styles.tab} onClick={() => setTab('myclubs')}>
          내 동아리{myClubs.length > 0 && <span style={styles.tabBadge}>{myClubs.length}</span>}
        </button>
        <button style={tab === 'profile'  ? styles.tabActive : styles.tab} onClick={() => setTab('profile')}>학생 정보</button>
        <button style={tab === 'password' ? styles.tabActive : styles.tab} onClick={() => setTab('password')}>비밀번호 변경</button>
      </div>

      {/* ── 내 정보 탭 ── */}
      {tab === 'info' && (
        <>
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>관심 태그</h3>
              <Link to="/tags" style={styles.editLink}>수정하기</Link>
            </div>
            <div style={styles.tagRow}>
              {tags.length === 0
                ? <p style={styles.empty}><Link to="/tags">태그를 선택해 추천을 받아보세요</Link></p>
                : tags.map((t) => <span key={t} style={styles.tag}>{t}</span>)}
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>찜한 동아리 ({wishlist.length})</h3>
              <Link to="/wishlist" style={styles.editLink}>전체 보기</Link>
            </div>
            {wishlist.length === 0
              ? <p style={styles.empty}>찜한 동아리가 없습니다.</p>
              : wishlist.slice(0, 3).map((c) => (
                <div key={c.clubId} style={styles.miniCard}>
                  <span style={styles.clubName}>{c.clubName}</span>
                  <span style={styles.score}>{c.scorePct}% 일치</span>
                </div>
              ))}
          </section>

          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>신청 현황 ({apps.length})</h3>
              <Link to="/applications" style={styles.editLink}>전체 보기</Link>
            </div>
            {apps.length === 0
              ? <p style={styles.empty}>신청한 동아리가 없습니다.</p>
              : apps.slice(0, 3).map((a) => (
                <div key={a.appId} style={styles.miniCard}>
                  <span style={styles.clubName}>{a.clubName}</span>
                  <span style={{ ...styles.badge, background: STATUS[a.status]?.color }}>
                    {STATUS[a.status]?.label}
                  </span>
                </div>
              ))}
          </section>
        </>
      )}

      {/* ── 내 동아리 탭 ── */}
      {tab === 'myclubs' && (
        <section style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, marginBottom: 20 }}>내 동아리 ({myClubs.length})</h3>
          {myClubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={styles.empty}>아직 가입된 동아리가 없습니다.</p>
              <Link to="/clubs" style={{ color: '#ff6b35', fontSize: 14 }}>동아리 탐색하러 가기</Link>
            </div>
          ) : (
            <div style={styles.clubGrid}>
              {myClubs.map((c) => (
                <Link key={c.clubId} to={`/clubs/${c.clubId}`} style={styles.clubCard}>
                  <div style={styles.clubCardImg}>
                    {c.imagePath
                      ? <img src={c.imagePath.startsWith('http') ? c.imagePath : `/images/clubs/${c.imagePath}`} alt={c.clubName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 28, color: '#cbd5e1' }}>{c.clubName[0]}</span>}
                  </div>
                  <div style={styles.clubCardBody}>
                    <p style={styles.clubCardCategory}>{c.category}</p>
                    <p style={styles.clubCardName}>{c.clubName}</p>
                    {c.isOwner
                      ? <span style={styles.ownerBadge}>👑 동아리장</span>
                      : <span style={styles.memberBadge}>✅ 멤버</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── 비밀번호 변경 탭 ── */}
      {tab === 'password' && (
        <section style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, marginBottom: 20 }}>비밀번호 변경</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setPwMsg('');
            if (pwForm.next !== pwForm.confirm) {
              setPwMsg('새 비밀번호가 일치하지 않습니다.');
              return;
            }
            setPwSaving(true);
            try {
              await changePasswordLoggedIn(user.userId, pwForm.current, pwForm.next);
              setPwMsg('비밀번호가 변경되었습니다.');
              setPwForm({ current: '', next: '', confirm: '' });
            } catch (err) {
              setPwMsg(err.response?.data?.error || '변경 중 오류가 발생했습니다.');
            } finally {
              setPwSaving(false);
            }
          }} style={styles.form}>
            {['current', 'next', 'confirm'].map((key) => (
              <div key={key}>
                <label style={styles.label}>
                  {key === 'current' ? '현재 비밀번호' : key === 'next' ? '새 비밀번호' : '새 비밀번호 확인'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: 64 }}
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[key]}
                    onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                    required
                  />
                  <button type="button" style={styles.eyeBtn}
                    onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}>
                    {showPw[key] ? '숨기기' : '표시'}
                  </button>
                </div>
              </div>
            ))}
            {pwMsg && (
              <p style={{ fontSize: 13, color: pwMsg.includes('변경되었습니다') ? '#10b981' : '#ef4444' }}>
                {pwMsg}
              </p>
            )}
            <button style={styles.btn} type="submit" disabled={pwSaving}>
              {pwSaving ? '변경 중...' : '변경하기'}
            </button>
          </form>
        </section>
      )}

      {/* ── 학생 정보 탭 ── */}
      {tab === 'profile' && (
        <section style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, marginBottom: 20 }}>학생 정보 입력</h3>
          <p style={styles.desc}>학번, 학과, 재학인증서를 입력하면 추천받기·찜·신청 기능을 이용할 수 있습니다.</p>
          <form onSubmit={handleProfileSave} style={styles.form}>
            <label style={styles.label}>학번</label>
            <input
              style={{ ...styles.input, background: saved ? '#f8fafc' : '#fff' }}
              type="text"
              placeholder="예: 20230001"
              value={profile.studentNo}
              readOnly={saved}
              onChange={(e) => setProfile({ ...profile, studentNo: e.target.value })}
            />

            <label style={styles.label}>학과</label>
            <input
              style={{ ...styles.input, background: saved ? '#f8fafc' : '#fff' }}
              type="text"
              placeholder="예: 컴퓨터공학과"
              value={profile.department}
              readOnly={saved}
              onChange={(e) => setProfile({ ...profile, department: e.target.value })}
            />

            <label style={styles.label}>재학인증서 (PNG)</label>
            {profile.certificatePath && (
              <p style={styles.certInfo}>현재 파일: {profile.certificatePath}</p>
            )}
            {!saved && (
              <input
                style={{ ...styles.input, padding: '8px 14px' }}
                type="file"
                accept="image/png"
                onChange={(e) => setCertFile(e.target.files[0] || null)}
              />
            )}

            {saveMsg && !saved && (
              <p style={{ color: saveMsg.includes('오류') ? '#ef4444' : '#10b981', fontSize: 13 }}>
                {saveMsg}
              </p>
            )}

            {saved ? (
              <button
                type="button"
                style={styles.editBtn}
                onClick={() => { setSaved(false); setSaveMsg(''); }}
              >
                수정하기
              </button>
            ) : (
              <button style={styles.btn} type="submit" disabled={saving}>
                {saving ? '저장 중...' : '저장하기'}
              </button>
            )}
          </form>
        </section>
      )}
    </div>
  );
}

const styles = {
  container:     { maxWidth: 680, margin: '40px auto', padding: '0 20px' },
  header:        { display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 14, padding: '28px 32px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  avatar:        { width: 64, height: 64, borderRadius: '50%', background: '#ff6b35', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 },
  tabBar:        { display: 'flex', gap: 0, marginBottom: 16, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  tab:           { flex: 1, padding: '14px 0', border: 'none', background: '#fff', color: '#888', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderBottom: '2px solid transparent' },
  tabActive:     { flex: 1, padding: '14px 0', border: 'none', background: '#fff', color: '#ff6b35', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderBottom: '2px solid #ff6b35' },
  section:       { background: '#fff', borderRadius: 12, padding: '22px 24px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle:  { margin: 0, fontSize: 16 },
  editLink:      { fontSize: 13, color: '#ff6b35' },
  tagRow:        { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag:           { padding: '6px 14px', borderRadius: 20, background: '#fff0e8', color: '#ff6b35', fontSize: 13, fontWeight: 600 },
  miniCard:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  clubName:      { fontSize: 14, color: '#333' },
  score:         { fontSize: 13, color: '#ff6b35', fontWeight: 600 },
  badge:         { padding: '4px 10px', borderRadius: 12, color: '#fff', fontSize: 12 },
  empty:         { color: '#aaa', fontSize: 14 },
  desc:          { color: '#666', fontSize: 13, marginBottom: 20, lineHeight: 1.6 },
  form:          { display: 'flex', flexDirection: 'column', gap: 8 },
  label:         { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 8 },
  input:         { padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  certInfo:      { fontSize: 12, color: '#888', margin: '0 0 4px' },
  btn:           { marginTop: 12, padding: 12, background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  editBtn:       { marginTop: 12, padding: 12, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  eyeBtn:        { position: 'absolute', right: 0, top: 0, bottom: 0, padding: '0 12px', border: 'none', background: 'transparent', color: '#888', fontSize: 12, cursor: 'pointer' },
  tabBadge:      { display: 'inline-block', marginLeft: 5, background: '#ff6b35', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 },
  clubGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 },
  clubCard:      { borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', textDecoration: 'none', color: 'inherit', display: 'block' },
  clubCardImg:   { height: 110, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  clubCardBody:  { padding: '12px 14px' },
  clubCardCategory: { fontSize: 11, color: '#ff6b35', fontWeight: 700, margin: '0 0 4px' },
  clubCardName:  { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 8px' },
  memberBadge:   { fontSize: 12, color: '#10b981', fontWeight: 600 },
  ownerBadge:    { fontSize: 12, color: '#d97706', fontWeight: 600 },
};
