import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTags, getMyApplications, getWishlist } from '../../api';

export default function MyPage({ user }) {
  const [tags, setTags]       = useState([]);
  const [apps, setApps]       = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (!user?.userId) return;
    getTags(user.userId).then((r) => setTags(r.data)).catch(() => {});
    getMyApplications(user.userId).then((r) => setApps(r.data)).catch(() => {});
    getWishlist(user.userId).then((r) => setWishlist(r.data)).catch(() => {});
  }, [user]);

  const STATUS = { PENDING: { label: '검토 중', color: '#f59e0b' }, APPROVED: { label: '승인', color: '#10b981' }, REJECTED: { label: '거절', color: '#ef4444' } };

  return (
    <div style={styles.container}>
      {/* 프로필 헤더 */}
      <div style={styles.header}>
        <div style={styles.avatar}>{user?.name?.[0]}</div>
        <div>
          <h2 style={{ margin: 0 }}>{user?.name}</h2>
          <p style={{ color: '#888', margin: '4px 0 0', fontSize: 14 }}>{user?.email}</p>
        </div>
      </div>

      {/* 관심 태그 */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>관심 태그</h3>
          <Link to="/tags" style={styles.editLink}>수정하기</Link>
        </div>
        <div style={styles.tagRow}>
          {tags.length === 0
            ? <p style={styles.empty}><Link to="/tags">태그를 선택해 추천을 받아보세요</Link></p>
            : tags.map((t) => <span key={t} style={styles.tag}>{t}</span>)}
        </div>
      </section>

      {/* 찜 목록 요약 */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>찜한 동아리 ({wishlist.length})</h3>
          <Link to="/wishlist" style={styles.editLink}>전체 보기</Link>
        </div>
        {wishlist.length === 0
          ? <p style={styles.empty}>찜한 동아리가 없습니다.</p>
          : wishlist.slice(0, 3).map((c) => (
            <div key={c.clubId} style={styles.miniCard}>
              <span style={styles.clubName}>{c.clubName}</span>
              <span style={styles.score}>{c.scorePct}% 일치</span>
            </div>
          ))}
      </section>

      {/* 신청 현황 */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>신청 현황 ({apps.length})</h3>
          <Link to="/applications" style={styles.editLink}>전체 보기</Link>
        </div>
        {apps.length === 0
          ? <p style={styles.empty}>신청한 동아리가 없습니다.</p>
          : apps.slice(0, 3).map((a) => (
            <div key={a.appId} style={styles.miniCard}>
              <span style={styles.clubName}>동아리 #{a.clubId}</span>
              <span style={{ ...styles.badge, background: STATUS[a.status]?.color }}>
                {STATUS[a.status]?.label}
              </span>
            </div>
          ))}
      </section>
    </div>
  );
}

const styles = {
  container: { maxWidth: 680, margin: '40px auto', padding: '0 20px' },
  header: { display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 14, padding: '28px 32px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  avatar: { width: 64, height: 64, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 },
  section: { background: '#fff', borderRadius: 12, padding: '22px 24px', marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { margin: 0, fontSize: 16 },
  editLink: { fontSize: 13, color: '#4f46e5' },
  tagRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { padding: '6px 14px', borderRadius: 20, background: '#eef2ff', color: '#4f46e5', fontSize: 13, fontWeight: 600 },
  miniCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  clubName: { fontSize: 14, color: '#333' },
  score: { fontSize: 13, color: '#4f46e5', fontWeight: 600 },
  badge: { padding: '4px 10px', borderRadius: 12, color: '#fff', fontSize: 12 },
  empty: { color: '#aaa', fontSize: 14 },
};
