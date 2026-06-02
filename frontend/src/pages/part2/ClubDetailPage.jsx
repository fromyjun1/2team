import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClub, addWishlist, removeWishlist, applyClub, getWishlist, getMyApplications } from '../../api';

export default function ClubDetailPage({ userId }) {
  const { clubId } = useParams();
  const navigate   = useNavigate();
  const [club, setClub]       = useState(null);
  const [wished, setWished]   = useState(false);
  const [applying, setApplying] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [applyError, setApplyError] = useState('');

  const requireLogin = () => { if (!userId) { navigate('/login'); return true; } return false; };

  useEffect(() => {
    let alive = true;
    const clubIdNum = Number(clubId);
    Promise.all([
      getClub(clubId),
      userId ? getWishlist(userId) : Promise.resolve(null),
      userId ? getMyApplications(userId) : Promise.resolve(null),
    ]).then(([clubRes, wishRes, appRes]) => {
      if (!alive) return;
      setClub(clubRes.data);
      if (wishRes) setWished(wishRes.data.some((item) => item.clubId === clubIdNum));
      if (appRes) setSubmitted(appRes.data.some((a) => Number(a.clubId) === clubIdNum));
    });
    return () => { alive = false; };
  }, [clubId, userId]);

  const toggleWish = async () => {
    if (requireLogin()) return;
    if (wished) { await removeWishlist(userId, clubId); setWished(false); }
    else        { await addWishlist(userId, clubId);    setWished(true);  }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (requireLogin()) return;
    setApplyError('');
    try {
      await applyClub({ userId, clubId: Number(clubId), motivation });
      setSubmitted(true);
      setApplying(false);
    } catch (err) {
      setApplyError(err.response?.data?.error || '신청 중 오류가 발생했습니다.');
    }
  };

  if (!club) return <p style={{ textAlign: 'center', marginTop: 80 }}>불러오는 중...</p>;

  return (
    <div style={styles.container}>
      {/* 헤더 이미지 */}
      <div style={styles.heroBox}>
        {club.imagePath
          ? <img src={club.imagePath.startsWith('http') ? club.imagePath : `/images/clubs/${club.imagePath}`} alt={club.clubName} style={styles.heroImg} />
          : <div style={styles.heroPlaceholder}>{club.clubName[0]}</div>}
      </div>

      <div style={styles.content}>
        {/* 기본 정보 */}
        <div style={styles.topRow}>
          <div>
            <span style={styles.category}>{club.category}</span>
            <h1 style={styles.clubName}>{club.clubName}</h1>
          </div>
          <button style={{ ...styles.wishBtn, ...(wished ? styles.wished : {}) }} onClick={toggleWish}>
            {wished ? '♥ 찜 취소' : '♡ 찜하기'}
          </button>
        </div>

        <p style={styles.desc}>{club.description}</p>

        {/* 태그 */}
        {club.tags?.length > 0 && (
          <div style={styles.tagRow}>
            {club.tags.map((t) => (
              <span key={t.tagId} style={styles.tag}>{t.tagName}</span>
            ))}
          </div>
        )}

        {/* 정보 그리드 */}
        <div style={styles.infoGrid}>
          <div style={styles.infoBox}><p style={styles.infoLabel}>최대 인원</p><p style={styles.infoVal}>{club.maxMembers}명</p></div>
          <div style={styles.infoBox}><p style={styles.infoLabel}>문의 이메일</p><p style={styles.infoVal}>{club.contactEmail}</p></div>
        </div>

        {/* 하단 버튼 */}
        <div style={styles.btnRow}>
          <Link to={`/clubs/${clubId}/qna`} style={styles.qnaBtn}>Q&A 게시판</Link>
          {club.creatorId === userId ? (
            <button style={styles.manageBtn} onClick={() => navigate(`/clubs/${clubId}/manage`)}>
              ⚙ 관리하기
            </button>
          ) : (
            <>
              {!submitted && (
                <button style={styles.applyBtn} onClick={() => { if (!requireLogin()) setApplying(!applying); }}>
                  {applying ? '취소' : '가입 신청하기'}
                </button>
              )}
              {submitted && <span style={styles.successMsg}>신청 완료!</span>}
            </>
          )}
        </div>

        {/* 신청 폼 인라인 */}
        {applying && (
          <form onSubmit={handleApply} style={styles.applyForm}>
            <textarea
              style={styles.textarea}
              rows={5}
              placeholder="지원 동기를 작성해 주세요."
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              required
            />
            {applyError && <p style={styles.applyErrorMsg}>{applyError}</p>}
            <button style={styles.submitBtn} type="submit">제출</button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 760, margin: '0 auto', paddingBottom: 60 },
  heroBox: { height: 240, overflow: 'hidden', background: '#e2e8f0' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  heroPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 72, color: '#94a3b8' },
  content: { padding: '28px 32px' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  category: { fontSize: 12, color: '#4f46e5', fontWeight: 700, letterSpacing: 1 },
  clubName: { margin: '4px 0 0', fontSize: 26 },
  wishBtn: { padding: '9px 18px', border: '1px solid #ddd', borderRadius: 24, background: '#fff', cursor: 'pointer', fontSize: 14 },
  wished: { background: '#fef2f2', borderColor: '#fca5a5', color: '#ef4444' },
  desc: { color: '#555', lineHeight: 1.7, marginBottom: 20 },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: { padding: '6px 14px', borderRadius: 20, background: '#f1f5ff', color: '#4f46e5', fontSize: 13 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 },
  infoBox: { background: '#f8fafc', borderRadius: 10, padding: '14px 18px' },
  infoLabel: { fontSize: 12, color: '#888', margin: '0 0 4px' },
  infoVal: { fontSize: 15, fontWeight: 600, margin: 0 },
  btnRow: { display: 'flex', gap: 12, alignItems: 'center' },
  qnaBtn: { padding: '10px 22px', border: '1px solid #4f46e5', borderRadius: 8, color: '#4f46e5', fontSize: 14 },
  applyBtn:  { padding: '10px 22px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  manageBtn: { padding: '10px 22px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  successMsg: { color: '#10b981', fontWeight: 600 },
  applyForm: { marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  textarea: { padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  submitBtn: { padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  applyErrorMsg: { color: '#ef4444', fontSize: 13, margin: 0 },
};
