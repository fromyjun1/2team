import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClubs } from '../../api';

const CATEGORIES = ['전체', '문화/예술', '스포츠', '학술', '봉사', '기타'];

export default function ClubGalleryPage() {
  const navigate = useNavigate();
  const [clubs, setClubs]       = useState([]);
  const [category, setCategory] = useState('전체');

  useEffect(() => {
    getClubs(category === '전체' ? null : category).then((res) => setClubs(res.data));
  }, [category]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>동아리 목록</h2>

      {/* 카테고리 필터 */}
      <div style={styles.filterRow}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            style={{ ...styles.filterBtn, ...(category === c ? styles.filterActive : {}) }}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      <div style={styles.grid}>
        {clubs.map((club) => (
          <div key={club.clubId} style={styles.card} onClick={() => navigate(`/clubs/${club.clubId}`)}>
            <div style={styles.imgBox}>
              {club.imagePath
                ? <img src={`/images/clubs/${club.imagePath}`} alt={club.clubName} style={styles.img} />
                : <div style={styles.imgPlaceholder}>{club.clubName[0]}</div>
              }
            </div>
            <div style={styles.cardBody}>
              <span style={styles.category}>{club.category}</span>
              <h3 style={styles.clubName}>{club.clubName}</h3>
              <p style={styles.desc}>{club.description?.slice(0, 50)}...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '40px auto', padding: '0 20px' },
  title: { fontSize: 22, marginBottom: 20 },
  filterRow: { display: 'flex', gap: 8, marginBottom: 24 },
  filterBtn: { padding: '7px 16px', borderRadius: 20, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13 },
  filterActive: { background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 },
  card: { borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer', background: '#fff', transition: 'transform 0.15s' },
  imgBox: { height: 140, overflow: 'hidden', background: '#f0f0f0' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 40, color: '#999' },
  cardBody: { padding: '14px 16px' },
  category: { fontSize: 11, color: '#4f46e5', fontWeight: 600, textTransform: 'uppercase' },
  clubName: { margin: '4px 0 6px', fontSize: 16 },
  desc: { fontSize: 13, color: '#666', margin: 0 },
};
