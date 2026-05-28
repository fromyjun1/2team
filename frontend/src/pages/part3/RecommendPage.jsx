import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecommendations, addWishlist, removeWishlist } from '../../api';

export default function RecommendPage({ userId }) {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations(userId)
      .then((res) => setResults(res.data))
      .finally(() => setLoading(false));
  }, [userId]);

  const toggleWish = async (club) => {
    if (club.wishlisted) {
      await removeWishlist(userId, club.clubId);
    } else {
      await addWishlist(userId, club.clubId);
    }
    setResults((prev) =>
      prev.map((c) => c.clubId === club.clubId ? { ...c, wishlisted: !c.wishlisted } : c)
    );
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>매칭 중...</p>;

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>나에게 딱 맞는 동아리</h2>
          <p style={styles.sub}>선택한 태그를 기반으로 추천된 결과입니다.</p>
        </div>
        <button onClick={() => navigate('/tags?from=recommend')} style={styles.editTagBtn}>
          태그 수정하기
        </button>
      </div>

      {results.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p style={{ color: '#999', marginBottom: 16 }}>관심 태그를 먼저 선택해 주세요.</p>
          <button onClick={() => navigate('/tags')} style={styles.tagBtn}>
            태그 선택하러 가기
          </button>
        </div>
      )}

      {results.map((club, idx) => (
        <div key={club.clubId} style={styles.card}>
          {/* 순위 배지 */}
          <div style={{ ...styles.rankBadge, background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#cd7f32' }}>
            {idx + 1}위
          </div>

          <div style={styles.cardBody}>
            <div>
              <Link to={`/clubs/${club.clubId}`} style={styles.clubNameLink}>
                <h3 style={styles.clubName}>{club.clubName}</h3>
              </Link>
              <p style={styles.desc}>{club.description}</p>
            </div>

            {/* 일치율 바 */}
            <div style={styles.matchRow}>
              <span style={styles.matchLabel}>
                회원님과 <strong style={{ color: '#4f46e5' }}>{club.scorePct}%</strong> 일치
                &nbsp;({club.matchCount}/{club.totalTags} 태그)
              </span>
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: `${club.scorePct}%` }} />
              </div>
            </div>
          </div>

          {/* 찜 버튼 */}
          <button
            style={{ ...styles.wishBtn, ...(club.wishlisted ? styles.wished : {}) }}
            onClick={() => toggleWish(club)}
          >
            {club.wishlisted ? '♥ 찜 취소' : '♡ 찜하기'}
          </button>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: { maxWidth: 700, margin: '40px auto', padding: '0 20px' },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 22, marginBottom: 6 },
  sub: { color: '#888', fontSize: 14, margin: 0 },
  editTagBtn: { padding: '8px 18px', background: '#fff', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', alignSelf: 'center' },
  card: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', position: 'relative' },
  rankBadge: { minWidth: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 },
  cardBody: { flex: 1 },
  clubNameLink: { textDecoration: 'none', color: 'inherit' },
  clubName: { margin: '0 0 4px', fontSize: 17 },
  desc: { margin: '0 0 10px', color: '#666', fontSize: 13 },
  matchRow: { display: 'flex', flexDirection: 'column', gap: 4 },
  matchLabel: { fontSize: 13, color: '#444' },
  barBg: { height: 6, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: '#4f46e5', borderRadius: 4, transition: 'width 0.4s' },
  wishBtn: { padding: '8px 14px', border: '1px solid #ddd', borderRadius: 20, background: '#fff', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' },
  wished: { background: '#fef2f2', borderColor: '#fca5a5', color: '#ef4444' },
  tagBtn: { padding: '10px 28px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
};
