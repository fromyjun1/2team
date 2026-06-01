import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWishlist, removeWishlist } from '../../api';

export default function WishlistPage({ userId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () =>
    getWishlist(userId).then((r) => setList(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, [userId]);

  const handleRemove = async (clubId) => {
    await removeWishlist(userId, clubId);
    setList((p) => p.filter((c) => c.clubId !== clubId));
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: 80, color: '#ff6b35', fontWeight: 700 }}>불러오는 중...</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>찜한 동아리</h2>
      {list.length === 0 && (
        <div style={styles.empty}>
          <p>찜한 동아리가 없습니다.</p>
          <button style={styles.goBtn} onClick={() => navigate('/recommend')}>추천 받으러 가기</button>
        </div>
      )}
      {list.map((club) => (
        <div key={club.clubId} style={styles.card}>
          <div style={styles.left}>
            <h3 style={styles.clubName}>{club.clubName}</h3>
            <p style={styles.desc}>{club.description?.slice(0, 60)}...</p>
            <div style={styles.barRow}>
              <span style={styles.pct}>{club.scorePct}% 일치</span>
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: `${club.scorePct}%` }} />
              </div>
            </div>
          </div>
          <div style={styles.btnCol}>
            <button style={styles.detailBtn} onClick={() => navigate(`/clubs/${club.clubId}`)}>상세 보기</button>
            <button style={styles.removeBtn} onClick={() => handleRemove(club.clubId)}>찜 취소</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { maxWidth: 700, margin: '40px auto', padding: '0 20px' },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 24, color: '#2d1b0e' },
  empty: { textAlign: 'center', padding: '80px 0', color: '#b08070' },
  goBtn: { marginTop: 16, padding: '10px 24px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: 100, fontWeight: 700, cursor: 'pointer', fontSize: 14 },
  card: { display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 20, padding: '20px 24px', marginBottom: 14, boxShadow: '0 4px 20px rgba(255,107,53,0.08)', border: '2px solid #ffe8db' },
  left: { flex: 1 },
  clubName: { margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#2d1b0e' },
  desc: { color: '#7c5a4a', fontSize: 13, margin: '0 0 10px' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10 },
  pct: { fontSize: 13, color: '#ff6b35', fontWeight: 700, minWidth: 60 },
  barBg: { flex: 1, height: 6, background: '#ffe0d0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: '#ff6b35', borderRadius: 4 },
  btnCol: { display: 'flex', flexDirection: 'column', gap: 8 },
  detailBtn: { padding: '8px 16px', border: '2px solid #ff6b35', borderRadius: 100, color: '#ff6b35', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  removeBtn: { padding: '8px 16px', border: '1px solid #fca5a5', borderRadius: 100, color: '#ef4444', background: '#fff', cursor: 'pointer', fontSize: 13 },
};
