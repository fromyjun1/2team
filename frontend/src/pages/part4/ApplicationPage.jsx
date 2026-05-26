import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyApplications } from '../../api';

const STATUS_LABEL = { PENDING: '검토 중', APPROVED: '승인', REJECTED: '거절' };
const STATUS_COLOR = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };

export default function ApplicationPage({ userId }) {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    getMyApplications(userId).then((r) => setApplications(r.data));
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
  title:       { fontSize: 22, marginBottom: 24 },
  appCard:        { background: '#fff', borderRadius: 10, padding: '18px 22px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardTop:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  motivationText: { fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' },
  metaText:       { color: '#aaa', fontSize: 12, margin: '4px 0 0' },
  commentText:    { color: '#ef4444', fontSize: 13, margin: '6px 0 0' },
  badge:          { padding: '4px 12px', borderRadius: 20, color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  emptyMsg:       { textAlign: 'center', color: '#aaa', marginTop: 60 },
};
