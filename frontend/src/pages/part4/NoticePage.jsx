import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNotices, createNotice, deleteNotice, getClub } from '../../api';

export default function NoticePage({ user }) {
  const { clubId } = useParams();
  const navigate   = useNavigate();
  const userId     = user?.userId;

  const [notices, setNotices]   = useState([]);
  const [club, setClub]         = useState(null);
  const [error, setError]       = useState('');
  const [writing, setWriting]   = useState(false);
  const [form, setForm]         = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const isCreator = club?.creatorId === userId;

  const load = () => {
    getClub(clubId).then((r) => setClub(r.data)).catch(() => {});
    getNotices(clubId)
      .then((r) => { setNotices(r.data); setError(''); })
      .catch((err) => setError(err.response?.data?.error || '공지사항을 불러올 수 없습니다.'));
  };

  useEffect(() => { load(); }, [clubId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await createNotice({ clubId: Number(clubId), ...form });
      setForm({ title: '', content: '' });
      setWriting(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || '공지 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm('이 공지를 삭제하시겠습니까?')) return;
    try {
      await deleteNotice(noticeId);
      load();
    } catch {
      setError('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate(`/clubs/${clubId}`)}>
        ← {club?.clubName || '동아리'} 페이지로
      </button>
      <h2 style={styles.title}>공지사항</h2>

      {error && <p style={styles.error}>{error}</p>}

      {!error && notices.length === 0 && (
        <p style={styles.empty}>등록된 공지사항이 없습니다.</p>
      )}

      {notices.map((n) => (
        <div key={n.noticeId} style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.pin}>📌</span>
            <h4 style={styles.cardTitle}>{n.title}</h4>
            {isCreator && (
              <button style={styles.deleteBtn} onClick={() => handleDelete(n.noticeId)}>삭제</button>
            )}
          </div>
          <p style={styles.cardContent}>{n.content}</p>
          <p style={styles.cardMeta}>
            {n.authorName}
            <span style={styles.creatorBadge}>👑 동아리장</span>
            &nbsp;·&nbsp; {new Date(n.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}

      {isCreator && (
        writing ? (
          <form onSubmit={handleSubmit} style={styles.writeForm}>
            <h3 style={styles.writeTitle}>공지 작성</h3>
            <input
              style={styles.input}
              placeholder="제목"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              style={styles.textarea}
              rows={5}
              placeholder="내용을 입력하세요"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={styles.submitBtn} type="submit" disabled={submitting}>
                {submitting ? '등록 중...' : '공지 등록'}
              </button>
              <button style={styles.cancelBtn} type="button" onClick={() => setWriting(false)}>취소</button>
            </div>
          </form>
        ) : (
          <button style={styles.writeBtn} onClick={() => setWriting(true)}>+ 공지 작성하기</button>
        )
      )}
    </div>
  );
}

const styles = {
  container:   { maxWidth: 720, margin: '40px auto', padding: '0 20px 60px' },
  backBtn:     { background: 'none', border: 'none', color: '#ff6b35', cursor: 'pointer', fontSize: 14, marginBottom: 12, padding: 0 },
  title:       { fontSize: 22, marginBottom: 24 },
  error:       { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 20 },
  empty:       { color: '#aaa', textAlign: 'center', marginTop: 40 },
  card:        { background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader:  { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  pin:         { fontSize: 16 },
  cardTitle:   { margin: 0, fontSize: 16, flex: 1 },
  deleteBtn:   { padding: '3px 10px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#ef4444', cursor: 'pointer' },
  cardContent: { color: '#444', fontSize: 14, lineHeight: 1.7, margin: '0 0 10px', whiteSpace: 'pre-wrap' },
  cardMeta:    { fontSize: 12, color: '#aaa', margin: 0 },
  writeForm:   { marginTop: 24, background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  writeTitle:  { margin: '0 0 8px', fontSize: 16 },
  input:       { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea:    { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  submitBtn:   { padding: '10px 20px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  cancelBtn:   { padding: '10px 20px', background: '#e5e7eb', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  writeBtn:     { marginTop: 20, width: '100%', padding: '14px', border: '2px dashed #ff6b35', borderRadius: 12, background: '#fff9f5', color: '#ff6b35', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  creatorBadge: { display: 'inline-block', marginLeft: 6, padding: '1px 7px', borderRadius: 20, background: '#fefce8', color: '#d97706', fontSize: 10, fontWeight: 700, border: '1px solid #fde68a', verticalAlign: 'middle' },
};
