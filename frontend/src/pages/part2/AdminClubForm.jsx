import { useState } from 'react';
import { createClub } from '../../api';

const ALL_TAGS = [
  '#음악', '#밴드', '#정기공연', '#스포츠', '#풋살', '#농구',
  '#학술', '#스터디', '#IT', '#친목', '#봉사', '#여행',
  '#월요일', '#화요일', '#수요일', '#목요일', '#금요일', '#주말활동',
  '#초보환영', '#열정적', '#소규모',
];
const CATEGORIES = ['문화/예술', '스포츠', '학술', '봉사', '기타'];

export default function AdminClubForm() {
  const [form, setForm] = useState({
    clubName: '', description: '', category: '문화/예술',
    maxMembers: 30, contactEmail: '', imagePath: '',
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleTag = (tag) =>
    setSelectedTags((p) => p.includes(tag) ? p.filter((t) => t !== tag) : [...p, tag]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createClub({ ...form, maxMembers: Number(form.maxMembers), tags: selectedTags });
    setDone(true);
  };

  if (done) return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <p style={{ fontSize: 20, marginBottom: 12 }}>동아리가 등록되었습니다!</p>
      <button style={styles.btn} onClick={() => { setDone(false); setForm({ clubName: '', description: '', category: '문화/예술', maxMembers: 30, contactEmail: '', imagePath: '' }); setSelectedTags([]); }}>
        다시 등록
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>동아리 등록 (관리자)</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>동아리명 *</label>
        <input style={styles.input} value={form.clubName} onChange={set('clubName')} required />

        <label style={styles.label}>카테고리 *</label>
        <select style={styles.input} value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label style={styles.label}>소개글 *</label>
        <textarea style={styles.textarea} rows={5} value={form.description} onChange={set('description')} required />

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>최대 인원</label>
            <input style={styles.input} type="number" min={1} max={200} value={form.maxMembers} onChange={set('maxMembers')} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={styles.label}>문의 이메일</label>
            <input style={styles.input} type="email" value={form.contactEmail} onChange={set('contactEmail')} />
          </div>
        </div>

        <label style={styles.label}>대표 이미지 파일명 (예: club.jpg)</label>
        <input style={styles.input} value={form.imagePath} onChange={set('imagePath')} placeholder="이미지 파일명 (선택)" />

        <label style={styles.label}>태그 선택</label>
        <div style={styles.tagGrid}>
          {ALL_TAGS.map((tag) => (
            <button type="button" key={tag}
              style={{ ...styles.tag, ...(selectedTags.includes(tag) ? styles.tagOn : {}) }}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <button style={styles.btn} type="submit">등록하기</button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: 660, margin: '40px auto', padding: '0 20px' },
  title: { fontSize: 22, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  label: { fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 2 },
  input: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea: { padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  row: { display: 'flex', gap: 16 },
  tagGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  tag: { padding: '7px 14px', borderRadius: 20, border: '2px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 13 },
  tagOn: { borderColor: '#4f46e5', background: '#eef2ff', color: '#4f46e5', fontWeight: 600 },
  btn: { marginTop: 8, padding: 13, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
};
