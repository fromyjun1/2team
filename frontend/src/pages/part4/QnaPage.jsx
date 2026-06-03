import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getQnaList, createQuestion, createReply, updateQna, deleteQna, getClub } from '../../api';

export default function QnaPage({ user }) {
  const { clubId } = useParams();
  const userId = user?.userId;

  const [list, setList]               = useState([]);
  const [clubCreatorId, setClubCreatorId] = useState(null);
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [isSecret, setIsSecret]       = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId]     = useState(null);
  const [editTitle, setEditTitle]     = useState('');
  const [editContent, setEditContent] = useState('');

  const load = () => getQnaList(clubId).then((r) => setList(r.data));

  useEffect(() => {
    load();
    getClub(clubId).then((r) => setClubCreatorId(r.data.creatorId));
  }, [clubId]);

  const canEditOrDelete = (post) => {
    if (!userId) return false;
    return userId === post.authorId ||
           user?.role === 'ADMIN';
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    await createQuestion({ clubId: Number(clubId), authorId: userId, title, content, isSecret: isSecret ? 'Y' : 'N' });
    setTitle(''); setContent(''); setIsSecret(false);
    load();
  };

  const submitReply = async (parentId) => {
    if (!replyContent.trim()) return;
    await createReply(parentId, { authorId: userId, content: replyContent });
    setReplyTarget(null); setReplyContent('');
    load();
  };

  const startEdit = (post) => {
    setEditingId(post.qnaId);
    setEditTitle(post.title || '');
    setEditContent(post.content);
    setReplyTarget(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
  };

  const submitEdit = async (post) => {
    if (!editContent.trim()) return;
    const isQuestion = post.parentId == null;
    await updateQna(post.qnaId, {
      title: isQuestion ? editTitle : undefined,
      content: editContent,
    });
    cancelEdit();
    load();
  };

  const handleDelete = async (post) => {
    const isQuestion = post.parentId == null;
    const msg = isQuestion
      ? '이 질문을 삭제하면 모든 답변도 함께 삭제됩니다. 삭제하시겠습니까?'
      : '이 답변을 삭제하시겠습니까?';
    if (!window.confirm(msg)) return;
    await deleteQna(post.qnaId);
    load();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Q&A 게시판</h2>

      {list.length === 0 && <p style={styles.emptyMsg}>아직 질문이 없습니다. 첫 번째로 질문해 보세요!</p>}

      {list.map((q) => (
        <div key={q.qnaId} style={styles.qCard}>
          {/* 질문 */}
          {editingId === q.qnaId ? (
            <div style={styles.editForm}>
              <input
                style={styles.input}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목"
              />
              <textarea
                style={styles.textarea}
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="내용"
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={styles.submitBtn} onClick={() => submitEdit(q)}>저장</button>
                <button style={styles.cancelBtn} onClick={cancelEdit}>취소</button>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.qHeader}>
                {q.isSecret === 'Y' && <span style={styles.secretBadge}>비밀글</span>}
                <h4 style={styles.qTitle}>{q.title}</h4>
                {canEditOrDelete(q) && (
                  <div style={styles.actionBtns}>
                    <button style={styles.editBtn} onClick={() => startEdit(q)}>수정</button>
                    <button style={styles.deleteBtn} onClick={() => handleDelete(q)}>삭제</button>
                  </div>
                )}
              </div>
              <p style={styles.qContent}>{q.content}</p>
              <div style={styles.qMeta}>
                {q.authorName}
                {q.creator && <span style={styles.creatorBadge}>👑 동아리장</span>}
                {!q.creator && q.member && <span style={styles.memberBadge}>멤버</span>}
                &nbsp;|&nbsp;{new Date(q.createdAt).toLocaleDateString()}
              </div>
            </>
          )}

          {/* 답변 목록 */}
          {q.replies?.map((r) => (
            <div key={r.qnaId} style={styles.replyBox}>
              <span style={styles.replyArrow}>└</span>
              <div style={{ flex: 1 }}>
                {editingId === r.qnaId ? (
                  <div style={styles.editForm}>
                    <textarea
                      style={styles.textarea}
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="내용"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={styles.submitBtn} onClick={() => submitEdit(r)}>저장</button>
                      <button style={styles.cancelBtn} onClick={cancelEdit}>취소</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={styles.replyContent}>{r.content}</p>
                      {canEditOrDelete(r) && (
                        <div style={styles.actionBtns}>
                          <button style={styles.editBtn} onClick={() => startEdit(r)}>수정</button>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(r)}>삭제</button>
                        </div>
                      )}
                    </div>
                    <span style={styles.qMeta}>
                      {r.authorName}
                      {r.creator && <span style={styles.creatorBadge}>👑 동아리장</span>}
                      {!r.creator && r.member && <span style={styles.memberBadge}>멤버</span>}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* 답변 입력 토글 */}
          {editingId !== q.qnaId && (
            replyTarget === q.qnaId ? (
              <div style={styles.replyForm}>
                <textarea style={styles.textarea} rows={3} placeholder="답변을 입력하세요"
                  value={replyContent} onChange={(e) => setReplyContent(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={styles.submitBtn} onClick={() => submitReply(q.qnaId)}>등록</button>
                  <button style={styles.cancelBtn} onClick={() => setReplyTarget(null)}>취소</button>
                </div>
              </div>
            ) : (
              <button style={styles.replyBtn} onClick={() => { setReplyTarget(q.qnaId); setReplyContent(''); }}>
                답변 달기
              </button>
            )
          )}
        </div>
      ))}

      {/* 질문 작성 폼 */}
      <form onSubmit={submitQuestion} style={styles.newForm}>
        <h3 style={{ margin: '0 0 14px', fontSize: 16 }}>질문 작성</h3>
        <input style={styles.input} placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea style={styles.textarea} rows={4} placeholder="내용을 입력하세요" value={content} onChange={(e) => setContent(e.target.value)} required />
        <label style={styles.checkRow}>
          <input type="checkbox" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
          &nbsp;비밀글로 작성
        </label>
        <button style={styles.submitBtn} type="submit">질문 등록</button>
      </form>
    </div>
  );
}

const styles = {
  container:   { maxWidth: 720, margin: '40px auto', padding: '0 20px 60px' },
  title:       { fontSize: 22, marginBottom: 24 },
  emptyMsg:    { color: '#aaa', textAlign: 'center', marginTop: 40, marginBottom: 40 },
  qCard:       { background: '#fff', borderRadius: 10, padding: '18px 22px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  qHeader:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  secretBadge: { fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 10 },
  qTitle:      { margin: 0, fontSize: 16, flex: 1 },
  qContent:    { color: '#444', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' },
  qMeta:       { fontSize: 12, color: '#aaa' },
  replyBox:    { display: 'flex', gap: 10, marginTop: 12, paddingLeft: 12, borderLeft: '3px solid #e5e7eb' },
  replyArrow:  { color: '#aaa', paddingTop: 2 },
  replyContent:{ fontSize: 14, color: '#555', margin: '0 0 4px', flex: 1 },
  replyForm:   { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  replyBtn:    { marginTop: 10, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555' },
  memberBadge:  { display: 'inline-block', marginLeft: 6, padding: '1px 7px', borderRadius: 20, background: '#fff0e8', color: '#ff6b35', fontSize: 10, fontWeight: 700, border: '1px solid #ffe0d0', verticalAlign: 'middle' },
  creatorBadge: { display: 'inline-block', marginLeft: 6, padding: '1px 7px', borderRadius: 20, background: '#fefce8', color: '#d97706', fontSize: 10, fontWeight: 700, border: '1px solid #fde68a', verticalAlign: 'middle' },
  newForm:     { marginTop: 32, background: '#fff9f5', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 },
  editForm:    { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 },
  input:       { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea:    { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  checkRow:    { fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 4 },
  submitBtn:   { padding: '10px 20px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  cancelBtn:   { padding: '10px 20px', background: '#e5e7eb', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  actionBtns:  { display: 'flex', gap: 4, marginLeft: 'auto' },
  editBtn:     { padding: '3px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 6, background: '#fff', color: '#555', cursor: 'pointer' },
  deleteBtn:   { padding: '3px 10px', fontSize: 12, border: '1px solid #fca5a5', borderRadius: 6, background: '#fff', color: '#ef4444', cursor: 'pointer' },
};
