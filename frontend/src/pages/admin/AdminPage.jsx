import { useState, useEffect, useCallback } from 'react';
import {
  getAdminStats, getAdminUsers, changeUserRole,
  getAdminClubs, deactivateClub, deleteClubPermanent,
  getAdminApplications, updateAppStatus,
} from '../../api';

const TABS = ['대시보드', '회원 관리', '동아리 관리', '신청 관리'];

export default function AdminPage() {
  const [tab, setTab]               = useState(0);
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]);
  const [clubs, setClubs]           = useState([]);
  const [applications, setApps]     = useState([]);
  const [appFilter, setAppFilter]   = useState('ALL');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(async (fn, setter) => {
    setLoading(true);
    setError('');
    try { const r = await fn(); setter(r.data); }
    catch { setError('데이터를 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 0) load(getAdminStats, setStats);
    if (tab === 1) load(getAdminUsers, setUsers);
    if (tab === 2) load(getAdminClubs, setClubs);
    if (tab === 3) load(getAdminApplications, setApps);
  }, [tab, load]);

  const handleRoleChange = async (userId, role) => {
    try { await changeUserRole(userId, role); load(getAdminUsers, setUsers); }
    catch { alert('역할 변경에 실패했습니다.'); }
  };

  const handleDeactivate = async (clubId, clubName) => {
    if (!window.confirm(`"${clubName}" 동아리를 비활성화하시겠습니까?`)) return;
    try { await deactivateClub(clubId); load(getAdminClubs, setClubs); }
    catch { alert('비활성화에 실패했습니다.'); }
  };

  const handleDelete = async (clubId, clubName) => {
    if (!window.confirm(`"${clubName}" 동아리를 완전히 삭제하시겠습니까?\n관련 신청, 찜, Q&A가 모두 삭제되며 복구할 수 없습니다.`)) return;
    try { await deleteClubPermanent(clubId); load(getAdminClubs, setClubs); }
    catch { alert('삭제에 실패했습니다.'); }
  };

  const handleAppStatus = async (appId, status) => {
    try { await updateAppStatus(appId, status, null); load(getAdminApplications, setApps); }
    catch { alert('상태 변경에 실패했습니다.'); }
  };

  const filteredApps = appFilter === 'ALL'
    ? applications
    : applications.filter(a => a.status === appFilter);

  return (
    <div style={s.page}>
      <h1 style={s.title}>관리자 대시보드</h1>

      <div style={s.tabs}>
        {TABS.map((t, i) => (
          <button key={t}
            style={{ ...s.tab, ...(tab === i ? s.tabActive : {}) }}
            onClick={() => setTab(i)}
          >{t}</button>
        ))}
      </div>

      {error && <div style={s.error}>{error}</div>}
      {loading && <div style={s.loading}>불러오는 중...</div>}

      {/* ── 대시보드 ── */}
      {!loading && tab === 0 && stats && (
        <div style={s.statsGrid}>
          <StatCard label="총 회원"    value={stats.users}        color="#ff6b35" />
          <StatCard label="활성 동아리" value={stats.clubs}        color="#ff6b35" />
          <StatCard label="총 신청"    value={stats.applications} color="#059669" />
          <StatCard label="대기 중"    value={stats.pending}      color="#d97706" />
        </div>
      )}

      {/* ── 회원 관리 ── */}
      {!loading && tab === 1 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['이름', '이메일', '학번', '학과', '가입일', '역할'].map(h =>
                  <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId} style={s.tr}>
                  <td style={s.td}>{u.name}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.studentNo  || '-'}</td>
                  <td style={s.td}>{u.department || '-'}</td>
                  <td style={s.td}>{u.createdAt ? u.createdAt.slice(0, 10) : '-'}</td>
                  <td style={s.td}>
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.userId, e.target.value)}
                      style={s.select}
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={s.empty}>회원이 없습니다.</div>}
        </div>
      )}

      {/* ── 동아리 관리 ── */}
      {!loading && tab === 2 && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['동아리명', '카테고리', '최대인원', '상태', '관리'].map(h =>
                  <th key={h} style={s.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {clubs.map(c => (
                <tr key={c.clubId} style={s.tr}>
                  <td style={s.td}>{c.clubName}</td>
                  <td style={s.td}>{c.category}</td>
                  <td style={s.td}>{c.maxMembers}명</td>
                  <td style={s.td}>
                    <span style={{
                      ...s.badge,
                      background: c.isActive === 'Y' ? '#d1fae5' : '#f3f4f6',
                      color:      c.isActive === 'Y' ? '#065f46' : '#6b7280',
                    }}>
                      {c.isActive === 'Y' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {c.isActive === 'Y' && (
                        <button style={s.dangerBtn} onClick={() => handleDeactivate(c.clubId, c.clubName)}>
                          비활성화
                        </button>
                      )}
                      <button style={s.deleteBtn} onClick={() => handleDelete(c.clubId, c.clubName)}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clubs.length === 0 && <div style={s.empty}>동아리가 없습니다.</div>}
        </div>
      )}

      {/* ── 신청 관리 ── */}
      {!loading && tab === 3 && (
        <div>
          <div style={s.filterRow}>
            {[['ALL', '전체'], ['PENDING', '대기'], ['APPROVED', '승인'], ['REJECTED', '거절']].map(([val, label]) => (
              <button key={val}
                style={{ ...s.filterBtn, ...(appFilter === val ? s.filterActive : {}) }}
                onClick={() => setAppFilter(val)}
              >{label}</button>
            ))}
          </div>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['신청자', '동아리', '신청일', '상태', '관리'].map(h =>
                    <th key={h} style={s.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(a => (
                  <tr key={a.appId} style={s.tr}>
                    <td style={s.td}>{a.userName}</td>
                    <td style={s.td}>{a.clubName}</td>
                    <td style={s.td}>{a.appliedAt ? String(a.appliedAt).slice(0, 10) : '-'}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, ...statusStyle(a.status) }}>
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td style={s.td}>
                      {a.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={s.approveBtn} onClick={() => handleAppStatus(a.appId, 'APPROVED')}>승인</button>
                          <button style={s.rejectBtn}  onClick={() => handleAppStatus(a.appId, 'REJECTED')}>거절</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredApps.length === 0 && <div style={s.empty}>신청 내역이 없습니다.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...s.card, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 36, fontWeight: 900, color }}>{value ?? '-'}</div>
      <div style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function statusLabel(status) {
  return { PENDING: '대기', APPROVED: '승인', REJECTED: '거절' }[status] || status;
}

function statusStyle(status) {
  return ({
    PENDING:  { background: '#fef3c7', color: '#92400e' },
    APPROVED: { background: '#d1fae5', color: '#065f46' },
    REJECTED: { background: '#fee2e2', color: '#991b1b' },
  })[status] || {};
}

const s = {
  page:        { maxWidth: 1000, margin: '40px auto', padding: '0 24px' },
  title:       { fontSize: 24, fontWeight: 900, color: '#2d1b0e', marginBottom: 24 },
  tabs:        { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid #f3f4f6' },
  tab:         { padding: '10px 22px', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, color: '#9ca3af', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: -2, transition: 'color .15s' },
  tabActive:   { color: '#ff6b35', borderBottom: '2px solid #ff6b35' },
  loading:     { textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14 },
  error:       { background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  card:        { background: '#fff', borderRadius: 12, padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  tableWrap:   { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th:          { padding: '14px 16px', background: '#f9fafb', fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'left', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #f3f4f6' },
  td:          { padding: '12px 16px', fontSize: 14, color: '#374151', verticalAlign: 'middle' },
  select:      { padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer' },
  badge:       { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  dangerBtn:   { padding: '6px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  deleteBtn:   { padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  filterRow:   { display: 'flex', gap: 8, marginBottom: 16 },
  filterBtn:   { padding: '8px 18px', border: '1px solid #e5e7eb', borderRadius: 20, background: '#fff', fontSize: 13, fontWeight: 600, color: '#6b7280', cursor: 'pointer' },
  filterActive:{ background: '#ff6b35', color: '#fff', borderColor: '#ff6b35' },
  approveBtn:  { padding: '5px 12px', background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  rejectBtn:   { padding: '5px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 },
  empty:       { textAlign: 'center', padding: 48, color: '#9ca3af', fontSize: 14 },
};
