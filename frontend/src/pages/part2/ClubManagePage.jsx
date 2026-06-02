import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClub, updateClub, updateClubTags, uploadClubImage, getClubApplications, updateAppStatus } from '../../api';

const CATEGORIES   = ['문화/예술', '스포츠', '학술', '봉사', '기타'];
const STATUS_LABEL = { PENDING: '검토 중', APPROVED: '승인', REJECTED: '거절' };
const STATUS_COLOR = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };

export default function ClubManagePage({ user }) {
  const { clubId } = useParams();
  const navigate   = useNavigate();
  const tagRef     = useRef(null);
  const [tab, setTab] = useState('applications');

  // 신청 심사 상태
  const [applications, setApplications] = useState([]);
  const [comments, setComments]         = useState({});   // { appId: string }

  // 동아리 정보 수정 상태
  const [form, setForm]       = useState(null);
  const [chips, setChips]     = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setPreview] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgType, setSaveMsgType] = useState('success');
  const [appLoadError, setAppLoadError] = useState('');
  const [expandedMotivations, setExpandedMotivations] = useState({});

  useEffect(() => {
    getClub(clubId).then((r) => {
      const c = r.data;
      if (c.creatorId !== user?.userId) { navigate(`/clubs/${clubId}`); return; }
      setForm({
        clubName: c.clubName, description: c.description || '',
        category: c.category || '문화/예술', maxMembers: c.maxMembers || 30,
        contactEmail: c.contactEmail || '',
        isRecruiting: c.isRecruiting || 'Y',
      });
      setChips(c.tags?.map((t) => t.tagName) || []);
      if (c.imagePath) setPreview(c.imagePath.startsWith('http') ? c.imagePath : `/images/clubs/${c.imagePath}`);
    });
    getClubApplications(clubId)
      .then((r) => setApplications(r.data))
      .catch(() => setAppLoadError('신청 목록을 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요.'));
  }, [clubId]);

  const toggleMotivation = (appId) =>
    setExpandedMotivations((prev) => ({ ...prev, [appId]: !prev[appId] }));

  // ── 신청 심사 ──
  const handleStatus = async (appId, status) => {
    await updateAppStatus(appId, status, comments[appId] || '');
    setApplications((prev) => prev.map((a) => a.appId === appId ? { ...a, status } : a));
  };

  // ── 동아리 정보 수정 ──
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const addTag = (raw) => {
    const word = raw.trim();
    if (!word) return;
    const tag = word.startsWith('#') ? word : '#' + word;
    setChips((prev) => prev.includes(tag) ? prev : [...prev, tag]);
  };
  const handleTagInput = (e) => {
    const val = e.target.value;
    if (val.endsWith(' ')) { addTag(val); setTagInput(''); } else setTagInput(val);
  };
  const handleTagKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); setTagInput(''); }
    if (e.key === 'Backspace' && tagInput === '' && chips.length > 0)
      setChips((prev) => prev.slice(0, -1));
  };

  const toJpegFile = (file) =>
    new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) { reject(new Error('이미지 파일 크기는 10MB 이하여야 합니다.')); return; }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => blob
            ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
            : reject(new Error('이미지 변환에 실패했습니다.')),
          'image/jpeg', 0.92
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('지원하지 않는 이미지 형식입니다.')); };
      img.src = url;
    });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const converted = await toJpegFile(file);
      setImageFile(converted);
      setPreview(URL.createObjectURL(converted));
    } catch (err) {
      setSaveMsg(err.message);
      setSaveMsgType('error');
      e.target.value = '';
    }
  };

  const validateSave = () => {
    if (!form.clubName.trim()) return '동아리 이름을 입력해주세요.';
    const members = Number(form.maxMembers);
    if (!Number.isInteger(members) || members < 1 || members > 500)
      return '최대 인원은 1~500 사이의 정수여야 합니다.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      return '올바른 이메일 형식을 입력해주세요.';
    return '';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validateSave();
    if (validationError) { setSaveMsg(validationError); setSaveMsgType('error'); return; }
    setSaving(true); setSaveMsg('');
    try {
      let body = { ...form, maxMembers: Number(form.maxMembers) };
      if (imageFile) {
        const res = await uploadClubImage(imageFile);
        body.imagePath = res.data.imagePath;
      }
      await updateClub(clubId, body);
      await updateClubTags(clubId, chips);
      setSaveMsg('저장되었습니다.');
      setSaveMsgType('success');
      setImageFile(null);
    } catch (err) {
      setSaveMsg(err.response?.data?.error || '저장 중 오류가 발생했습니다.');
      setSaveMsgType('error');
    } finally { setSaving(false); }
  };

  if (!form) return <p style={{ textAlign: 'center', marginTop: 80 }}>불러오는 중...</p>;

  const pending  = applications.filter((a) => a.status === 'PENDING');
  const members  = applications.filter((a) => a.status === 'APPROVED');

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate(`/clubs/${clubId}`)}>← 동아리 페이지로</button>
      <h2 style={styles.title}>{form.clubName} 관리</h2>

      {/* 탭 */}
      <div style={styles.tabBar}>
        {[['applications','신청 심사'], ['edit','정보 수정'], ['members','멤버 목록']].map(([key, label]) => (
          <button key={key} style={tab === key ? styles.tabActive : styles.tab} onClick={() => setTab(key)}>
            {label}
            {key === 'applications' && pending.length > 0 && (
              <span style={styles.badge}>{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── 신청 심사 탭 ── */}
      {tab === 'applications' && (
        <div>
          {appLoadError && <p style={styles.errorMsg}>{appLoadError}</p>}
          {!appLoadError && applications.length === 0 && <p style={styles.empty}>신청자가 없습니다.</p>}
          {applications.map((app) => (
            <div key={app.appId} style={styles.appCard}>
              <div style={styles.appTop}>
                <strong>{app.userName}</strong>
                <span style={{ ...styles.statusBadge, background: STATUS_COLOR[app.status] }}>
                  {STATUS_LABEL[app.status]}
                </span>
              </div>
              {(() => {
                const text = app.motivation || '';
                const isLong = text.length > 80;
                const expanded = expandedMotivations[app.appId];
                return (
                  <>
                    <p style={styles.motivation}>
                      {isLong && !expanded ? text.slice(0, 80) + '...' : text}
                    </p>
                    {isLong && (
                      <button style={styles.moreBtn} onClick={() => toggleMotivation(app.appId)}>
                        {expanded ? '접기 ▲' : '더 보기 ▼'}
                      </button>
                    )}
                  </>
                );
              })()}
              <p style={styles.meta}>신청일: {new Date(app.appliedAt).toLocaleDateString()}</p>
              {app.status === 'PENDING' && (
                <div style={styles.reviewRow}>
                  <input
                    style={styles.commentInput}
                    type="text"
                    placeholder="검토 의견 (선택)"
                    value={comments[app.appId] || ''}
                    onChange={(e) => setComments({ ...comments, [app.appId]: e.target.value })}
                  />
                  <button style={styles.approveBtn} onClick={() => handleStatus(app.appId, 'APPROVED')}>승인</button>
                  <button style={styles.rejectBtn}  onClick={() => handleStatus(app.appId, 'REJECTED')}>거절</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 정보 수정 탭 ── */}
      {tab === 'edit' && (
        <form onSubmit={handleSave} style={styles.editForm}>
          <div style={styles.imageArea} onClick={() => document.getElementById('editImg').click()}>
            {imagePreview
              ? <img src={imagePreview} alt="미리보기" style={styles.previewImg} />
              : <div style={styles.imagePlaceholder}>📷 이미지 변경</div>}
          </div>
          <input id="editImg" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />

          <label style={styles.label}>동아리 이름</label>
          <input style={styles.input} type="text" value={form.clubName} onChange={set('clubName')} required />

          <label style={styles.label}>카테고리</label>
          <select style={styles.input} value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>

          <label style={styles.label}>소개</label>
          <textarea style={styles.textarea} rows={4} value={form.description} onChange={set('description')} />

          <label style={styles.label}>최대 인원</label>
          <input style={styles.input} type="number" min={1} value={form.maxMembers} onChange={set('maxMembers')} />

          <label style={styles.label}>모집 상태</label>
          <div style={styles.recruitingRow}>
            <button
              type="button"
              style={{ ...styles.recruitingBtn, ...(form.isRecruiting === 'Y' ? styles.recruitingActive : {}) }}
              onClick={() => setForm({ ...form, isRecruiting: 'Y' })}
            >
              ✅ 모집 중
            </button>
            <button
              type="button"
              style={{ ...styles.recruitingBtn, ...(form.isRecruiting === 'N' ? styles.recruitingClosed : {}) }}
              onClick={() => setForm({ ...form, isRecruiting: 'N' })}
            >
              🔴 모집 마감
            </button>
          </div>

          <label style={styles.label}>문의 이메일</label>
          <input style={styles.input} type="email" value={form.contactEmail} onChange={set('contactEmail')} />

          <label style={styles.label}>태그</label>
          <div style={styles.tagBox} onClick={() => tagRef.current?.focus()}>
            {chips.map((tag, i) => (
              <span key={i} style={styles.chip} onClick={(e) => { e.stopPropagation(); setChips((p) => p.filter((_, j) => j !== i)); }}>
                {tag} <span style={{ opacity: 0.6 }}>✕</span>
              </span>
            ))}
            <input
              ref={tagRef}
              style={styles.tagInput}
              type="text"
              value={tagInput}
              onChange={handleTagInput}
              onKeyDown={handleTagKey}
              placeholder={chips.length === 0 ? '태그 입력 (스페이스로 추가)' : ''}
            />
          </div>

          {saveMsg && <p style={{ color: saveMsgType === 'error' ? '#ef4444' : '#10b981', fontSize: 13 }}>{saveMsg}</p>}
          <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? '저장 중...' : '저장하기'}</button>
        </form>
      )}

      {/* ── 멤버 목록 탭 ── */}
      {tab === 'members' && (
        <div>
          {members.length === 0
            ? <p style={styles.empty}>승인된 멤버가 없습니다.</p>
            : members.map((app) => (
              <div key={app.appId} style={styles.memberCard}>
                <div>
                  <span style={styles.memberName}>{app.userName}</span>
                  {app.userId === user?.userId
                    ? <span style={styles.creatorBadge}>👑 동아리장</span>
                    : <span style={styles.memberBadge}>멤버</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={styles.memberDate}>{new Date(app.appliedAt).toLocaleDateString()} 가입</span>
                  <button
                    style={styles.kickBtn}
                    onClick={() => {
                      if (window.confirm(`${app.userName}님을 추방하시겠습니까?`)) {
                        handleStatus(app.appId, 'KICKED');
                      }
                    }}
                  >
                    추방
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container:       { maxWidth: 680, margin: '40px auto', padding: '0 20px' },
  backBtn:         { background: 'none', border: 'none', color: '#ff6b35', cursor: 'pointer', fontSize: 14, marginBottom: 12, padding: 0 },
  title:           { fontSize: 22, marginBottom: 20 },
  tabBar:          { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24 },
  tab:             { padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#888', display: 'flex', alignItems: 'center', gap: 6 },
  tabActive:       { padding: '10px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#ff6b35', fontWeight: 700, borderBottom: '2px solid #ff6b35', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 },
  badge:           { background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  empty:           { color: '#aaa', textAlign: 'center', marginTop: 40 },
  errorMsg:        { color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 20 },
  appCard:         { background: '#fff', borderRadius: 10, padding: '18px 22px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  appTop:          { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge:     { padding: '3px 10px', borderRadius: 12, color: '#fff', fontSize: 12, fontWeight: 600 },
  motivation:      { fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 4px', whiteSpace: 'pre-wrap' },
  moreBtn:         { background: 'none', border: 'none', color: '#ff6b35', fontSize: 12, cursor: 'pointer', padding: '0 0 6px', fontWeight: 600 },
  meta:            { fontSize: 12, color: '#aaa', margin: 0 },
  reviewRow:       { display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' },
  commentInput:    { flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 },
  approveBtn:      { padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  rejectBtn:       { padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  editForm:        { background: '#fff', borderRadius: 12, padding: '28px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  imageArea:       { height: 140, borderRadius: 10, border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' },
  previewImg:      { width: '100%', height: '100%', objectFit: 'cover' },
  imagePlaceholder:{ color: '#aaa', fontSize: 14 },
  label:           { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 4 },
  input:           { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea:        { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  tagBox:          { display: 'flex', flexWrap: 'wrap', gap: 6, border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', cursor: 'text', minHeight: 42 },
  chip:            { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, border: '1.5px solid #ff6b35', color: '#ff6b35', background: '#fff0e8', fontSize: 13, cursor: 'pointer', userSelect: 'none' },
  tagInput:        { flex: 1, minWidth: 80, border: 'none', outline: 'none', fontSize: 14 },
  saveBtn:         { marginTop: 8, padding: 12, background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
  memberCard:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '14px 20px', marginBottom: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
  memberName:      { fontSize: 15, fontWeight: 600, marginRight: 8 },
  memberBadge:     { display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#fff0e8', color: '#ff6b35', fontSize: 11, fontWeight: 700, border: '1px solid #ffe0d0' },
  creatorBadge:    { display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: '#fefce8', color: '#d97706', fontSize: 11, fontWeight: 700, border: '1px solid #fde68a' },
  memberDate:      { fontSize: 13, color: '#aaa' },
  kickBtn:         { padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  recruitingRow:   { display: 'flex', gap: 10 },
  recruitingBtn:   { flex: 1, padding: '10px', border: '2px solid #e5e7eb', borderRadius: 8, background: '#fff', fontSize: 14, cursor: 'pointer', color: '#888' },
  recruitingActive:{ border: '2px solid #10b981', background: '#f0fdf4', color: '#10b981', fontWeight: 700 },
  recruitingClosed:{ border: '2px solid #ef4444', background: '#fef2f2', color: '#ef4444', fontWeight: 700 },
};
