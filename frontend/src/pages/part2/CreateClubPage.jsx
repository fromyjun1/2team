import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClub, uploadClubImage } from '../../api';

const CATEGORIES = ['문화/예술', '스포츠', '학술', '봉사', '기타'];

export default function CreateClubPage() {
  const navigate = useNavigate();
  const inputRef  = useRef(null);

  const [form, setForm] = useState({
    clubName: '', description: '', category: '문화/예술',
    maxMembers: 30, contactEmail: '',
  });
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setPreview]  = useState(null);
  const [chips, setChips]           = useState([]);   // tag chips
  const [tagInput, setTagInput]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const addTag = (raw) => {
    const word = raw.trim();
    if (!word) return;
    const tag = word.startsWith('#') ? word : '#' + word;
    setChips((prev) => prev.includes(tag) ? prev : [...prev, tag]);
  };

  const handleTagInput = (e) => {
    const val = e.target.value;
    if (val.endsWith(' ')) { addTag(val); setTagInput(''); }
    else setTagInput(val);
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
      setError('');
    } catch (err) {
      setError(err.message);
      e.target.value = '';
    }
  };

  const validate = () => {
    if (!form.clubName.trim()) return '동아리 이름을 입력해주세요.';
    const members = Number(form.maxMembers);
    if (!Number.isInteger(members) || members < 1 || members > 500)
      return '최대 인원은 1~500 사이의 정수여야 합니다.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      return '올바른 이메일 형식을 입력해주세요.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSubmitting(true);
    setError('');
    try {
      let imagePath = null;
      if (imageFile) {
        const res = await uploadClubImage(imageFile);
        imagePath = res.data.imagePath;
      }
      const body = { ...form, maxMembers: Number(form.maxMembers), tags: chips, imagePath };
      const res  = await createClub(body);
      navigate(`/clubs/${res.data.clubId}`);
    } catch (err) {
      setError(err.response?.data?.error || '동아리 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>동아리 만들기</h2>
      <p style={styles.sub}>동아리를 만들면 자동으로 해당 동아리의 관리자가 됩니다.</p>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* 이미지 업로드 */}
        <div style={styles.imageArea} onClick={() => document.getElementById('imgInput').click()}>
          {imagePreview
            ? <img src={imagePreview} alt="미리보기" style={styles.previewImg} />
            : <div style={styles.imagePlaceholder}>📷<br /><span style={{ fontSize: 13 }}>대표 이미지 업로드</span></div>
          }
        </div>
        <input id="imgInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />

        <label style={styles.label}>동아리 이름 *</label>
        <input style={styles.input} type="text" placeholder="동아리 이름" value={form.clubName} onChange={set('clubName')} required />

        <label style={styles.label}>카테고리 *</label>
        <select style={styles.input} value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <label style={styles.label}>소개 *</label>
        <textarea style={styles.textarea} rows={4} placeholder="동아리를 소개해 주세요." value={form.description} onChange={set('description')} required />

        <label style={styles.label}>최대 인원</label>
        <input style={styles.input} type="number" min={1} max={500} value={form.maxMembers} onChange={set('maxMembers')} />

        <label style={styles.label}>문의 이메일</label>
        <input style={styles.input} type="email" placeholder="contact@example.com" value={form.contactEmail} onChange={set('contactEmail')} />

        <label style={styles.label}>태그 (스페이스 또는 Enter로 추가)</label>
        <div style={styles.tagBox} onClick={() => inputRef.current?.focus()}>
          {chips.map((tag, i) => (
            <span key={i} style={styles.chip} onClick={(e) => { e.stopPropagation(); setChips((p) => p.filter((_, j) => j !== i)); }}>
              {tag} <span style={{ opacity: 0.6 }}>✕</span>
            </span>
          ))}
          <input
            ref={inputRef}
            style={styles.tagInput}
            type="text"
            placeholder={chips.length === 0 ? '예: 밴드  음악  #공연' : ''}
            value={tagInput}
            onChange={handleTagInput}
            onKeyDown={handleTagKey}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.btnRow}>
          <button type="button" style={styles.cancelBtn} onClick={() => navigate(-1)}>취소</button>
          <button type="submit" style={styles.submitBtn} disabled={submitting}>
            {submitting ? '생성 중...' : '동아리 만들기'}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container:       { maxWidth: 600, margin: '40px auto', padding: '0 20px' },
  title:           { fontSize: 22, marginBottom: 6 },
  sub:             { color: '#888', fontSize: 13, marginBottom: 28 },
  form:            { background: '#fff', borderRadius: 14, padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 10 },
  imageArea:       { height: 160, borderRadius: 10, border: '2px dashed #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', marginBottom: 8 },
  previewImg:      { width: '100%', height: '100%', objectFit: 'cover' },
  imagePlaceholder:{ textAlign: 'center', color: '#aaa', fontSize: 28, lineHeight: 1.6 },
  label:           { fontSize: 13, fontWeight: 600, color: '#444', marginTop: 6 },
  input:           { padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 },
  textarea:        { padding: '11px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  tagBox:          { display: 'flex', flexWrap: 'wrap', gap: 6, border: '1px solid #ddd', borderRadius: 8, padding: '8px 12px', cursor: 'text', minHeight: 44 },
  chip:            { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, border: '1.5px solid #ff6b35', color: '#ff6b35', background: '#fff0e8', fontSize: 13, fontWeight: 600, cursor: 'pointer', userSelect: 'none' },
  tagInput:        { flex: 1, minWidth: 100, border: 'none', outline: 'none', fontSize: 14, padding: '2px 0' },
  error:           { color: '#ef4444', fontSize: 13 },
  btnRow:          { display: 'flex', gap: 10, marginTop: 8 },
  cancelBtn:       { flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 8, background: '#fff', fontSize: 15, cursor: 'pointer' },
  submitBtn:       { flex: 2, padding: 12, background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' },
};
