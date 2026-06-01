import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getQnaList, createQuestion, createReply } from '../../api';

export default function QnaPage({ userId }) {
  const { clubId } = useParams();
  const [list, setList]               = useState([]);
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [isSecret, setIsSecret]       = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const load = () => getQnaList(clubId).then((r) => setList(r.data));
  useEffect(() => { load(); }, [clubId]);

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

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Q&A 게시판</h2>

      {list.length === 0 && <p style={styles.emptyMsg}>아직 질문이 없습니다. 첫 번째로 질문해 보세요!</p>}

      {list.map((q) => (
        <div key={q.qnaId} style={styles.qCard}>
          {/* 질문 */}
          <div style={styles.qHeader}>
            {q.isSecret === 'Y' && <span style={styles.secretBadge}>비밀글</span>}
            <h4 style={styles.qTitle}>{q.title}</h4>
          </div>
          <p style={styles.qContent}>{q.content}</p>
          <div style={styles.qMeta}>
            {q.authorName}&nbsp;|&nbsp;{new Date(q.createdAt).toLocaleDateString()}
          </div>

          {/* 답변 목록 */}
          {q.replies?.map((r) => (
            <div key={r.qnaId} style={styles.replyBox}>
              <span style={styles.replyArrow}>└</span>
              <div style={{ flex: 1 }}>
                <p style={styles.replyContent}>{r.content}</p>
                <span style={styles.qMeta}>{r.authorName}</span>
              </div>
            </div>
          ))}

          {/* 답변 입력 토글 */}
          {replyTarget === q.qnaId ? (
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
  container: { maxWidth: 720, margin: '40px auto', padding: '0 20px 60px' },
  title: { fontSize: 22, marginBottom: 24 },
  emptyMsg: { color: '#aaa', textAlign: 'center', marginTop: 40, marginBottom: 40 },
  qCard: { background: '#fff', borderRadius: 10, padding: '18px 22px', marginBottom: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  qHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  secretBadge: { fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 10 },
  qTitle: { margin: 0, fontSize: 16 },
  qContent: { color: '#444', fontSize: 14, lineHeight: 1.6, margin: '0 0 8px' },
  qMeta: { fontSize: 12, color: '#aaa' },
  replyBox: { display: 'flex', gap: 10, marginTop: 12, paddingLeft: 12, borderLeft: '3px solid #e5e7eb' },
  replyArrow: { color: '#aaa', paddingTop: 2 },
  replyContent: { fontSize: 14, color: '#555', margin: '0 0 4px' },
  replyForm: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 },
  replyBtn: { marginTop: 10, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 12, color: '#555' },
  newForm: { marginTop: 32, background: '#f8fafc', borderRadius: 12, padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 },
  input: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  checkRow: { fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 4 },
  submitBtn: { padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  cancelBtn: { padding: '10px 20px', background: '#e5e7eb', color: '#555', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
};
