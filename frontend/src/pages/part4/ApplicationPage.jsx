import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications } from '../../api';

const STATUS_LABEL = { PENDING: '검토 중', APPROVED: '승인', REJECTED: '거절', QUIT: '탈퇴', KICKED: '추방' };
const STATUS_COLOR = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', QUIT: '#6b7280', KICKED: '#7c3aed' };

export default function ApplicationPage({ userId }) {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    getMyApplications(userId).then((r) => setApplications(r.data)).catch(() => {});
  }, [userId]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>신청 현황</h2>

      {applications.length === 0 ? (
        <p style={styles.emptyMsg}>
          신청 내역이 없습니다. <Link to="/clubs">동아리를 찾아보세요</Link>
        </p>
      ) : (
        applications.map((app) => (
          <div key={app.appId} style={styles.appCard}>
            <div style={{ flex: 1 }}>
              <div style={styles.cardTop}>
                <strong style={{ fontSize: 15 }}>{app.clubName}</strong>
                <span style={{ ...styles.badge, background: STATUS_COLOR[app.status] }}>
                  {STATUS_LABEL[app.status]}
                </span>
              </div>
              <p style={styles.motivationText}>{app.motivation}</p>
              <p style={styles.metaText}>신청일: {new Date(app.appliedAt).toLocaleDateString()}</p>
              {app.reviewComment && <p style={styles.commentText}>검토 의견: {app.reviewComment}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container:   { maxWidth: 620, margin: '40px auto', padding: '0 20px' },
  title:       { fontSize: 22, fontWeight: 800, marginBottom: 24, color: '#2d1b0e' },
  appCard:        { background: '#fff', borderRadius: 20, padding: '18px 22px', marginBottom: 12, boxShadow: '0 4px 20px rgba(255,107,53,0.08)', border: '2px solid #ffe8db' },
  cardTop:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  motivationText: { fontSize: 14, color: '#7c5a4a', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' },
  metaText:       { color: '#b08070', fontSize: 12, margin: '4px 0 0' },
  commentText:    { color: '#ef4444', fontSize: 13, margin: '6px 0 0' },
  badge:          { padding: '4px 12px', borderRadius: 100, color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  emptyMsg:       { textAlign: 'center', color: '#b08070', marginTop: 60 },
};
