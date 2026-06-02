import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMemberPosts, createMemberPost, createMemberReply, deleteMemberPost, getClub } from '../../api';

export default function MemberBoardPage({ user }) {
  const { clubId } = useParams();
  const navigate   = useNavigate();
  const userId     = user?.userId;

  const [posts, setPosts]       = useState([]);
  const [club, setClub]         = useState(null);
  const [error, setError]       = useState('');
  const [form, setForm]         = useState({ title: '', content: '' });
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCreator = club?.creatorId === userId;

  const canDelete = (post) =>
    userId === post.authorId || isCreator || user?.role === 'ADMIN';

  const load = () => {
    getClub(clubId).then((r) => setClub(r.data)).catch(() => {});
    getMemberPosts(clubId)
      .then((r) => { setPosts(r.data); setError(''); })
      .catch((err) => setError(err.response?.data?.error || '게시판을 불러올 수 없습니다.'));
  };

  useEffect(() => { load(); }, [clubId]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      await createMemberPost({ clubId: Number(clubId), ...form });
      setForm({ title: '', content: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || '글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyContent.trim()) return;
    try {
      await createMemberReply(parentId, { content: replyContent });
      setReplyTarget(null);
      setReplyContent('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || '댓글 작성 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteMemberPost(postId);
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
      <h2 style={styles.title}>멤버 게시판</h2>

      {error && <p style={styles.error}>{error}</p>}

      {!error && posts.length === 0 && (
        <p style={styles.empty}>아직 게시글이 없습니다. 첫 번째로 글을 작성해 보세요!</p>
      )}

      {posts.map((p) => (
        <div key={p.postId} style={styles.card}>
          <div style={styles.cardHeader}>
            <h4 style={styles.cardTitle}>{p.title}</h4>
            {canDelete(p) && (
              <button style={styles.deleteBtn} onClick={() => handleDelete(p.postId)}>삭제</button>
            )}
          </div>
          <p style={styles.cardContent}>{p.content}</p>
          <p style={styles.cardMeta}>
            {p.authorName}
            {club?.creatorId === p.authorId
              ? <span style={styles.creatorBadge}>👑 동아리장</span>
              : null}
            &nbsp;·&nbsp; {new Date(p.createdAt).toLocaleDateString()}
          </p>

          {/* 댓글 목록 */}
          {p.replies?.map((r) => (
            <div key={r.postId} style={styles.replyBox}>
              <span style={styles.replyArrow}>└</span>
              <div style={{ flex: 1 }}>
                <p style={styles.replyContent}>{r.content}</p>
                <span style={styles.cardMeta}>
                  {r.authorName}
                  {club?.creatorId === r.authorId && <span style={styles.creatorBadge}>👑 동아리장</span>}
                </span>
              </div>
              {canDelete(r) && (
                <button style={styles.deleteBtn} onClick={() => handleDelete(r.postId)}>삭제</button>
              )}
            </div>
          ))}

          {/* 댓글 입력 토글 */}
          {replyTarget === p.postId ? (
            <div style={styles.replyForm}>
              <textarea
                style={styles.textarea}
                rows={2}
                placeholder="댓글을 입력하세요"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={styles.submitBtn} onClick={() => handleReply(p.postId)}>등록</button>
                <button style={styles.cancelBtn} onClick={() => setReplyTarget(null)}>취소</button>
              </div>
            </div>
          ) : (
            <button style={styles.replyBtn} onClick={() => { setReplyTarget(p.postId); setReplyContent(''); }}>
              댓글 달기
            </button>
          )}
        </div>
      ))}

      {/* 글 작성 폼 */}
      {!error && (
        <form onSubmit={handlePost} style={styles.writeForm}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>글 작성</h3>
          <input
            style={styles.input}
            placeholder="제목"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <textarea
            style={styles.textarea}
            rows={4}
            placeholder="내용을 입력하세요"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          <button style={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? '등록 중...' : '글 작성'}
          </button>
        </form>
      )}
    </div>
  );
}

const styles = {
  container:    { maxWidth: 720, margin: '40px auto', padding: '0 20px 60px' },
  backBtn:      { background: 'none', border: 'none', color: '#ff6b35', cursor: 'pointer', fontSize: 14, marginBottom: 12, padding: 0 },
  title:        { fontSize: 22, marginBottom: 24 },
  error:        { color: '#ef4444', fontSize: 14, textAlign: 'center', marginTop: 20 },
  empty:        { color: '#aaa', textAlign: 'center', marginTop: 40, marginBottom: 40 },
  card:         { background: '#fff', borderRadius: 12, padding: '18px 22px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader:   { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle:    { margin: 0, fontSize: 16, flex: 1 },
  deleteBtn:    { padding: '3px 10px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#ef4444', cursor: 'pointer' },
  cardContent:  { color: '#444', fontSize: 14, lineHeight: 1.7, margin: '0 0 8px', whiteSpace: 'pre-wrap' },
  cardMeta:     { fontSize: 12, color: '#aaa', margin: 0 },
  replyBox:     { display: 'flex', gap: 10, marginTop: 10, paddingLeft: 12, borderLeft: '3px solid #e5e7eb', alignItems: 'flex-start' },
  replyArrow:   { color: '#aaa', paddingTop: 2, flexShrink: 0 },
  replyContent: { fontSize: 14, color: '#555', margin: '0 0 2px' },
  replyForm:    { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  replyBtn:     { marginTop: 10, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555' },
  writeForm:    { marginTop: 32, background: '#f0fdf4', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 },
  input:        { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea:     { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  submitBtn:    { padding: '10px 20px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  cancelBtn:    { padding: '10px 20px', background: '#e5e7eb', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  creatorBadge: { display: 'inline-block', marginLeft: 6, padding: '1px 7px', borderRadius: 20, background: '#fefce8', color: '#d97706', fontSize: 10, fontWeight: 700, border: '1px solid #fde68a', verticalAlign: 'middle' },
};
