import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getClub, addWishlist, removeWishlist, applyClub,
  getWishlist, getMyApplications, getMemberCount, leaveClub, reapply,
} from '../../api';

const APP_STATUS = {
  PENDING:  { label: '검토 중',        color: '#f59e0b', bg: '#fffbeb' },
  APPROVED: { label: '멤버로 승인됨',  color: '#10b981', bg: '#f0fdf4' },
  REJECTED: { label: '신청이 거절됨',  color: '#ef4444', bg: '#fef2f2' },
  QUIT:     { label: '탈퇴한 동아리',  color: '#6b7280', bg: '#f9fafb' },
  KICKED:   { label: '추방된 동아리',  color: '#7c3aed', bg: '#f5f3ff' },
};

export default function ClubDetailPage({ userId }) {
  const { clubId } = useParams();
  const navigate   = useNavigate();
  const [club, setClub]           = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [wished, setWished]       = useState(false);
  const [appStatus, setAppStatus] = useState(null);   // null | PENDING | APPROVED | REJECTED | QUIT
  const [memberCount, setMemberCount] = useState(0);
  const [applying, setApplying]   = useState(false);
  const [motivation, setMotivation] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantAge,  setApplicantAge]  = useState('');
  const [applyError, setApplyError] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const openConfirm = (title, message, onConfirm) =>
    setConfirmModal({ open: true, title, message, onConfirm });
  const closeConfirm = () =>
    setConfirmModal({ open: false, title: '', message: '', onConfirm: null });

  const requireLogin = () => { if (!userId) { navigate('/login'); return true; } return false; };

  const load = () => {
    const clubIdNum = Number(clubId);
    Promise.all([
      getClub(clubId),
      userId ? getWishlist(userId)        : Promise.resolve(null),
      userId ? getMyApplications(userId)  : Promise.resolve(null),
      getMemberCount(clubId),
    ]).then(([clubRes, wishRes, appRes, countRes]) => {
      setClub(clubRes.data);
      if (wishRes) setWished(wishRes.data.some((item) => item.clubId === clubIdNum));
      if (appRes) {
        const found = appRes.data.find((a) => Number(a.clubId) === clubIdNum);
        setAppStatus(found ? found.status : null);
      }
      setMemberCount(countRes.data.count);
    }).catch(() => setLoadError(true));
  };

  useEffect(() => { load(); }, [clubId, userId]);

  const toggleWish = async () => {
    if (requireLogin()) return;
    if (wished) { await removeWishlist(userId, clubId); setWished(false); }
    else        { await addWishlist(userId, clubId);    setWished(true);  }
  };

  const openApplyForm = () => {
    if (requireLogin()) return;
    // 이름 사전 입력 (localStorage에서)
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      if (stored.name) setApplicantName(stored.name);
    } catch {}
    setApplying(!applying);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (requireLogin()) return;
    setApplyError('');
    try {
      const payload = { clubId: Number(clubId), applicantName, applicantAge, motivation };
      if (appStatus === 'REJECTED' || appStatus === 'QUIT') {
        await reapply(payload);
      } else {
        await applyClub({ ...payload, userId });
      }
      setApplying(false);
      setMotivation('');
      setApplicantName('');
      setApplicantAge('');
      load();
    } catch (err) {
      setApplyError(err.response?.data?.error || '신청 중 오류가 발생했습니다.');
    }
  };

  const handleLeave = () => {
    openConfirm(
      '동아리 탈퇴',
      `정말 ${club?.clubName}에서 탈퇴하시겠습니까? 탈퇴 후 재신청이 가능합니다.`,
      async () => {
        try {
          await leaveClub(clubId);
          load();
        } catch {
          alert('탈퇴 처리 중 오류가 발생했습니다.');
        }
      }
    );
  };

  if (loadError) return <p style={{ textAlign: 'center', marginTop: 80, color: '#ef4444' }}>동아리 정보를 불러올 수 없습니다.</p>;
  if (!club) return <p style={{ textAlign: 'center', marginTop: 80 }}>불러오는 중...</p>;

  const isFull     = memberCount >= club.maxMembers;
  const isClosed   = club.isRecruiting === 'N';
  const isCreator  = club.creatorId === userId;
  const isMember   = appStatus === 'APPROVED';

  return (
    <div style={styles.container} className="club-detail-container">
      {/* 헤더 이미지 */}
      <div style={styles.heroBox}>
        {club.imagePath
          ? <img src={club.imagePath.startsWith('http') ? club.imagePath : `/images/clubs/${club.imagePath}`} alt={club.clubName} style={styles.heroImg} />
          : <div style={styles.heroPlaceholder}>{club.clubName?.[0] || '?'}</div>}
      </div>

      <div style={styles.content} className="club-detail-content">
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

        {club.tags?.length > 0 && (
          <div style={styles.tagRow}>
            {club.tags.map((t) => <span key={t.tagId} style={styles.tag}>{t.tagName}</span>)}
          </div>
        )}

        {/* 정보 그리드 */}
        <div style={styles.infoGrid} className="club-detail-infogrid">
          <div style={styles.infoBox}>
            <p style={styles.infoLabel}>최대 인원</p>
            <p style={styles.infoVal}>{club.maxMembers}명</p>
          </div>
          <div style={{ ...styles.infoBox, ...(isFull ? styles.infoBoxFull : {}) }}>
            <p style={styles.infoLabel}>현재 인원</p>
            <p style={{ ...styles.infoVal, color: isFull ? '#ef4444' : '#10b981' }}>
              {memberCount} / {club.maxMembers}명
              {isFull && ' 🔴'}
            </p>
          </div>
          <div style={styles.infoBox}>
            <p style={styles.infoLabel}>문의 이메일</p>
            <p style={styles.infoVal}>{club.contactEmail || '—'}</p>
          </div>
        </div>

        {/* 버튼 행 */}
        <div style={styles.btnRow} className="club-detail-btnrow">
          <Link to={`/clubs/${clubId}/qna`} style={styles.qnaBtn}>Q&A 게시판</Link>
          {(isMember || isCreator) && (
            <>
              <Link to={`/clubs/${clubId}/notices`} style={styles.memberBtn}>공지사항</Link>
              <Link to={`/clubs/${clubId}/board`}   style={styles.memberBtn}>멤버 게시판</Link>
            </>
          )}
          {isCreator && (
            <button style={styles.manageBtn} onClick={() => navigate(`/clubs/${clubId}/manage`)}>
              ⚙ 관리하기
            </button>
          )}
        </div>

        {/* 신청 상태 영역 */}
        {!isCreator && userId && (
          <div style={{ ...styles.statusBox, background: APP_STATUS[appStatus]?.bg || '#f8fafc', borderColor: APP_STATUS[appStatus]?.color || '#e5e7eb' }}>
            {appStatus === null && (
              (isFull || isClosed)
                ? <span style={{ ...styles.statusText, color: '#ef4444' }}>
                    🔴 {isClosed ? '모집이 마감되었습니다.' : '모집 마감 — 현재 정원이 가득 찼습니다.'}
                  </span>
                : <button style={styles.applyBtn} onClick={openApplyForm}>
                    {applying ? '취소' : '가입 신청하기'}
                  </button>
            )}
            {appStatus === 'PENDING' && (
              <span style={{ ...styles.statusText, color: APP_STATUS.PENDING.color }}>
                🕐 신청이 검토 중입니다. 결과가 나오면 알려드릴게요.
              </span>
            )}
            {appStatus === 'APPROVED' && (
              <div style={styles.statusRow}>
                <span style={{ ...styles.statusText, color: APP_STATUS.APPROVED.color }}>✅ 멤버로 승인되었습니다</span>
                <button style={styles.leaveBtn} onClick={handleLeave}>동아리 탈퇴하기</button>
              </div>
            )}
            {(appStatus === 'REJECTED' || appStatus === 'QUIT') && (
              <div style={styles.statusRow}>
                <span style={{ ...styles.statusText, color: APP_STATUS[appStatus].color }}>
                  {appStatus === 'REJECTED' ? '❌ 신청이 거절되었습니다.' : '👋 탈퇴한 동아리입니다.'}
                </span>
                {!(isFull || isClosed) && (
                  <button style={styles.applyBtn} onClick={openApplyForm}>
                    {applying ? '취소' : '다시 신청하기'}
                  </button>
                )}
              </div>
            )}
            {appStatus === 'KICKED' && (
              <span style={{ ...styles.statusText, color: APP_STATUS.KICKED.color }}>
                🚫 해당 동아리에서 추방되었습니다.
              </span>
            )}
          </div>
        )}

        {/* 신청 폼 */}
        {applying && (
          <form onSubmit={handleApply} style={styles.applyForm}>
            <p style={styles.formSection}>지원자 정보</p>
            <div style={styles.introRow}>
              <div style={{ flex: 2 }}>
                <label style={styles.formLabel}>이름</label>
                <input
                  style={styles.formInput}
                  type="text"
                  placeholder="이름을 입력해 주세요"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>나이</label>
                <input
                  style={styles.formInput}
                  type="number"
                  placeholder="나이"
                  min={1} max={99}
                  value={applicantAge}
                  onChange={(e) => setApplicantAge(e.target.value)}
                  required
                />
              </div>
            </div>
            <p style={{ ...styles.formSection, marginTop: 8 }}>지원 동기</p>
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

      {/* 확인 모달 */}
      {confirmModal.open && (
        <div style={styles.modalOverlay} onClick={closeConfirm}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{confirmModal.title}</h3>
            <p style={styles.modalMsg}>{confirmModal.message}</p>
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={closeConfirm}>취소</button>
              <button style={styles.modalConfirm} onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container:    { maxWidth: 760, margin: '0 auto', paddingBottom: 60 },
  heroBox:      { width: '100%', aspectRatio: '8 / 5', overflow: 'hidden', background: '#e2e8f0' },
  heroImg:      { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  heroPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 72, color: '#94a3b8' },
  content:      { padding: '28px 32px' },
  topRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  category:     { fontSize: 12, color: '#ff6b35', fontWeight: 700, letterSpacing: 1 },
  clubName:     { margin: '4px 0 0', fontSize: 26 },
  wishBtn:      { padding: '9px 18px', border: '1px solid #ddd', borderRadius: 24, background: '#fff', cursor: 'pointer', fontSize: 14 },
  wished:       { background: '#fef2f2', borderColor: '#fca5a5', color: '#ef4444' },
  desc:         { color: '#555', lineHeight: 1.7, marginBottom: 20 },
  tagRow:       { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag:          { padding: '6px 14px', borderRadius: 20, background: '#fff0e8', color: '#ff6b35', fontSize: 13 },
  infoGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 },
  infoBox:      { background: '#f8fafc', borderRadius: 10, padding: '14px 18px' },
  infoBoxFull:  { background: '#fef2f2' },
  infoLabel:    { fontSize: 12, color: '#888', margin: '0 0 4px' },
  infoVal:      { fontSize: 15, fontWeight: 600, margin: 0 },
  btnRow:       { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 },
  qnaBtn:       { padding: '10px 18px', border: '1px solid #ff6b35', borderRadius: 8, color: '#ff6b35', fontSize: 13, textDecoration: 'none' },
  memberBtn:    { padding: '10px 18px', border: '1px solid #8b5cf6', borderRadius: 8, color: '#8b5cf6', fontSize: 13, textDecoration: 'none' },
  manageBtn:    { padding: '10px 18px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  statusBox:    { borderRadius: 12, border: '1.5px solid', padding: '16px 20px', marginTop: 4 },
  statusRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  statusText:   { fontSize: 14, fontWeight: 600 },
  applyBtn:     { padding: '10px 22px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  leaveBtn:     { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  applyForm:    { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  formSection:  { margin: 0, fontSize: 13, fontWeight: 700, color: '#555' },
  introRow:     { display: 'flex', gap: 10 },
  formLabel:    { display: 'block', fontSize: 12, color: '#888', marginBottom: 4 },
  formInput:    { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' },
  textarea:     { padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  submitBtn:    { padding: '11px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  applyErrorMsg:{ color: '#ef4444', fontSize: 13, margin: 0 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalBox:     { background: '#fff', borderRadius: 16, padding: '32px 28px', width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' },
  modalTitle:   { margin: '0 0 12px', fontSize: 18, fontWeight: 700 },
  modalMsg:     { margin: '0 0 24px', fontSize: 14, color: '#555', lineHeight: 1.6 },
  modalBtns:    { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  modalCancel:  { padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', color: '#555', fontSize: 14, cursor: 'pointer' },
  modalConfirm: { padding: '10px 20px', border: 'none', borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};
