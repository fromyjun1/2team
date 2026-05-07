import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { applyClub, getMyApplications, getClub } from '../../api';

const STATUS_LABEL = { PENDING: '검토 중', APPROVED: '승인', REJECTED: '거절' };
const STATUS_COLOR = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };

export default function ApplicationPage({ userId }) {
  const location = useLocation();
  const navigate = useNavigate();

  // 동아리 상세에서 넘어올 때 state로 clubId 전달 가능
  const preClubId = location.state?.clubId;

  const [tab, setTab]                   = useState(preClubId ? 'form' : 'status');
  const [clubId, setClubId]             = useState(preClubId || '');
  const [clubName, setClubName]         = useState(location.state?.clubName || '');
  const [motivation, setMotivation]     = useState('');
  const [applications, setApplications] = useState([]);
  const [submitted, setSubmitted]       = useState(false);

  useEffect(() => {
    if (tab === 'status') {
      getMyApplications(userId).then((r) => setApplications(r.data));
    }
  }, [tab, userId]);

  useEffect(() => {
    if (clubId && !clubName) {
      getClub(clubId).then((r) => setClubName(r.data.clubName)).catch(() => {});
    }
  }, [clubId]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!clubId) { alert('동아리를 선택해 주세요.'); return; }
    try {
      await applyClub({ userId, clubId: Number(clubId), motivation });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.error || '신청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabRow}>
        {['form', 'status'].map((t) => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'form' ? '가입 신청' : '신청 현황'}
          </button>
        ))}
      </div>

      {/* 가입 신청 폼 */}
      {tab === 'form' && (
        submitted ? (
          <div style={styles.successBox}>
            <p style={{ fontSize: 22, marginBottom: 8 }}>신청 완료!</p>
            <p style={{ color: '#666', marginBottom: 20 }}>검토 후 결과를 안내해 드립니다.</p>
            <button style={styles.btn} onClick={() => { setTab('status'); setSubmitted(false); }}>신청 현황 보기</button>
          </div>
        ) : (
          <form onSubmit={handleApply} style={styles.form}>
            <h3 style={styles.formTitle}>
              {clubName ? `${clubName} 가입 신청` : '가입 신청'}
            </h3>
            {!preClubId && (
              <>
                <label style={styles.label}>동아리 ID</label>
                <input style={styles.input} type="number" placeholder="동아리 ID 입력" value={clubId}
                  onChange={(e) => { setClubId(e.target.value); setClubName(''); }} required />
              </>
            )}
            <label style={styles.label}>지원 동기 *</label>
            <textarea style={styles.textarea} rows={6}
              placeholder="동아리에 지원하게 된 이유와 활동 포부를 자유롭게 작성해 주세요."
              value={motivation} onChange={(e) => setMotivation(e.target.value)} required />
            <button style={styles.btn} type="submit">신청 제출</button>
          </form>
        )
      )}

      {/* 신청 현황 */}
      {tab === 'status' && (
        <div>
          {applications.length === 0
            ? <p style={styles.emptyMsg}>신청 내역이 없습니다. <Link to="/recommend">동아리를 찾아보세요</Link></p>
            : applications.map((app) => (
              <div key={app.appId} style={styles.appCard}>
                <div>
                  <strong style={{ fontSize: 15 }}>동아리 #{app.clubId}</strong>
                  <p style={styles.metaText}>신청일: {new Date(app.appliedAt).toLocaleDateString()}</p>
                  {app.reviewComment && <p style={styles.commentText}>사유: {app.reviewComment}</p>}
                </div>
                <span style={{ ...styles.badge, background: STATUS_COLOR[app.status] }}>
                  {STATUS_LABEL[app.status]}
                </span>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: 620, margin: '40px auto', padding: '0 20px' },
  tabRow: { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 28 },
  tab: { padding: '10px 28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, color: '#888' },
  tabActive: { borderBottom: '2px solid #4f46e5', color: '#4f46e5', fontWeight: 700 },
  form: { display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', borderRadius: 12, padding: '28px 32px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  formTitle: { margin: '0 0 8px', fontSize: 18 },
  label: { fontSize: 13, fontWeight: 600, color: '#444' },
  input: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea: { padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  btn: { padding: 13, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  successBox: { textAlign: 'center', padding: '70px 20px' },
  appCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '18px 22px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  metaText: { color: '#888', fontSize: 13, margin: '4px 0 0' },
  commentText: { color: '#ef4444', fontSize: 13, margin: '4px 0 0' },
  badge: { padding: '5px 14px', borderRadius: 20, color: '#fff', fontSize: 13, fontWeight: 600 },
  emptyMsg: { textAlign: 'center', color: '#aaa', marginTop: 60 },
};
