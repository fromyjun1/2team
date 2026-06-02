import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTags, updateTags } from '../../api';

const ALL_TAGS = [
  '#음악', '#밴드', '#정기공연', '#스포츠', '#풋살', '#농구',
  '#학술', '#스터디', '#IT', '#친목', '#봉사', '#여행',
  '#월요일', '#화요일', '#수요일', '#목요일', '#금요일', '#주말활동',
  '#초보환영', '#열정적', '#소규모',
];

export default function TagSelectPage({ userId, onSave }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getTags(userId).then((res) => setSelected(res.data));
  }, [userId]);

  const toggle = (tag) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (selected.length === 0) {
      setError('태그를 최소 1개 이상 선택해주세요.');
      return;
    }
    setError('');
    try {
      await updateTags(userId, selected);
      setSaved(true);
      if (onSave) onSave(selected);
      const from = searchParams.get('from');
      setTimeout(() => navigate(from ? `/${from}` : '/clubs'), 600);
    } catch {
      setError('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>관심 태그 선택</h2>
      <p style={styles.sub}>원하는 동아리 유형을 태그로 선택해 주세요 (복수 선택 가능)</p>
      <div style={styles.tagGrid}>
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            style={{ ...styles.tag, ...(selected.includes(tag) ? styles.tagSelected : {}) }}
            onClick={() => toggle(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      {error && <p style={styles.error}>{error}</p>}
      <button style={styles.saveBtn} onClick={handleSave}>
        {saved ? '저장 완료!' : `선택 완료 (${selected.length}개)`}
      </button>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '40px auto', padding: '0 20px' },
  title: { fontSize: 22, marginBottom: 8 },
  sub: { color: '#666', marginBottom: 24, fontSize: 14 },
  tagGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  tag: {
    padding: '8px 16px', borderRadius: 20, border: '2px solid #ddd',
    background: '#fff', cursor: 'pointer', fontSize: 14, color: '#555',
    transition: 'all 0.15s',
  },
  tagSelected: { borderColor: '#ff6b35', background: '#fff0e8', color: '#ff6b35', fontWeight: 600 },
  saveBtn: {
    width: '100%', padding: 14, background: '#ff6b35', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, cursor: 'pointer',
  },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 8, textAlign: 'center' },
};
