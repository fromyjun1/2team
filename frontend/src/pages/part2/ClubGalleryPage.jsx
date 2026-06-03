import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClubs } from '../../api';

const CATEGORIES = ['전체', '문화/예술', '스포츠', '학술', '봉사', '기타'];

const CATEGORY_EMOJI = {
  '전체': '🎪',
  '문화/예술': '🎵',
  '스포츠': '⚽',
  '학술': '💡',
  '봉사': '🤝',
  '기타': '🎮',
};

export default function ClubGalleryPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [clubs, setClubs]       = useState([]);
  const [category, setCategory] = useState('전체');
  const [chips, setChips]       = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [sortBy, setSortBy]     = useState('newest');

  useEffect(() => {
    getClubs(category === '전체' ? null : category).then((res) => setClubs(res.data));
  }, [category]);

  const addChip = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '-') return;
    const exclude = trimmed.startsWith('-');
    const word    = exclude ? trimmed.slice(1).trim() : trimmed;
    if (!word) return;
    setChips((prev) => {
      if (prev.some((c) => c.word === word && c.exclude === exclude)) return prev;
      return [...prev, { word, exclude }];
    });
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.endsWith(' ')) {
      addChip(val);
      setInputVal('');
    } else {
      setInputVal(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && inputVal === '' && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
    if (e.key === 'Enter') {
      addChip(inputVal);
      setInputVal('');
    }
  };

  const removeChip = (idx) => setChips((prev) => prev.filter((_, i) => i !== idx));

  const matchesWord = (club, word) => {
    const w = word.toLowerCase();
    const tagQuery = w.startsWith('#') ? w : '#' + w;
    return (
      club.clubName.toLowerCase().includes(w) ||
      (club.tags?.some((t) => t.tagName.toLowerCase().includes(tagQuery)) ?? false)
    );
  };

  const includeChips        = chips.filter((c) => !c.exclude);
  const excludeChips        = chips.filter((c) => c.exclude);
  const currentWord         = inputVal.trim();
  const isCurrentExclude    = currentWord.startsWith('-');
  const strippedCurrentWord = currentWord.replace(/^-/, '').trim();

  const filtered = clubs.filter((club) => {
    const hasPositive = includeChips.length > 0 || (!isCurrentExclude && strippedCurrentWord.length > 0);
    const positiveOk  = !hasPositive ||
      includeChips.some((c) => matchesWord(club, c.word)) ||
      (!isCurrentExclude && strippedCurrentWord.length > 0 && matchesWord(club, strippedCurrentWord));
    const negativeOk  =
      excludeChips.every((c) => !matchesWord(club, c.word)) &&
      !(isCurrentExclude && strippedCurrentWord.length > 0 && matchesWord(club, strippedCurrentWord));
    return positiveOk && negativeOk;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name')    return (a.clubName || '').localeCompare(b.clubName || '', 'ko');
    if (sortBy === 'members') return (b.maxMembers || 0) - (a.maxMembers || 0);
    if (!a.createdAt) return 1;
    if (!b.createdAt) return -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const hasFilter = chips.length > 0 || strippedCurrentWord.length > 0;

  return (
    <div style={{ background: '#fff9f5', minHeight: '100vh' }}>
      {/* 배너 */}
      <div style={styles.banner} className="gallery-banner">
        <div style={styles.bannerLeft}>
          <h1 style={styles.bannerTitle}>동아리 매칭 🎯</h1>
          <p style={styles.bannerDesc}>관심사 태그로 나와 맞는 동아리를 찾아보세요</p>
          <div style={styles.bannerSearch} onClick={() => inputRef.current?.focus()}>
            {chips.map((chip, i) => (
              <span
                key={i}
                style={chip.exclude ? styles.chipExclude : styles.chipInclude}
                onClick={(e) => { e.stopPropagation(); removeChip(i); }}
              >
                {chip.exclude ? '-' : ''}{chip.word.startsWith('#') ? chip.word : '#' + chip.word}
                <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}> ✕</span>
              </span>
            ))}
            <input
              ref={inputRef}
              style={styles.bannerInput}
              type="text"
              placeholder={chips.length === 0 ? '동아리명 또는 #태그 검색' : ''}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            {hasFilter && (
              <button style={styles.clearBtn} onClick={(e) => { e.stopPropagation(); setChips([]); setInputVal(''); }}>✕</button>
            )}
            <button style={styles.searchBtn}>검색</button>
          </div>
        </div>
        <div className="gallery-banner-emoji" style={{ fontSize: 100, lineHeight: 1 }}>🎪</div>
      </div>

      <div style={styles.section} className="gallery-section">
        {/* 인기 카테고리 */}
        <div style={styles.sectionTitle}>인기 카테고리</div>
        <div style={styles.popular}>
          {CATEGORIES.filter(c => c !== '전체').map((c) => (
            <div key={c} style={{ ...styles.popItem, ...(category === c ? styles.popItemActive : {}) }} onClick={() => setCategory(c)}>
              <div style={styles.popEmoji}>{CATEGORY_EMOJI[c]}</div>
              <div style={styles.popName}>{c}</div>
            </div>
          ))}
        </div>

        {/* 동아리 목록 헤더 */}
        <div style={styles.listHeader}>
          <div style={styles.sectionTitle}>
            전체 동아리{' '}
            <span style={{ color: '#ff6b35' }}>({sorted.length})</span>
          </div>
          <select style={styles.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">최신순</option>
            <option value="name">가나다순</option>
            <option value="members">인원 많은순</option>
          </select>
        </div>

        {/* 카테고리 칩 */}
        <div style={styles.chips}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {hasFilter && (
          <p style={{ fontSize: 13, color: '#7c5a4a', marginBottom: 12 }}>검색 결과 {sorted.length}개</p>
        )}

        {/* 카드 그리드 */}
        <div style={styles.grid}>
          {sorted.length === 0 && hasFilter && (
            <p style={{ color: '#b08070', fontSize: 14, gridColumn: '1/-1' }}>검색 결과가 없습니다.</p>
          )}
          {sorted.length === 0 && !hasFilter && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎪</div>
              <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>아직 등록된 동아리가 없습니다.</p>
              <p style={{ fontSize: 14 }}>첫 번째 동아리를 만들어 보세요!</p>
            </div>
          )}
          {sorted.map((club) => {
            const isClosed = club.isRecruiting === 'N';
            return (
              <div key={club.clubId} style={styles.card} onClick={() => navigate(`/clubs/${club.clubId}`)}>
                <div style={styles.cardImg}>
                  {club.imagePath
                    ? <img src={club.imagePath.startsWith('http') ? club.imagePath : `/images/clubs/${club.imagePath}`} alt={club.clubName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ fontSize: 56 }}>{CATEGORY_EMOJI[club.category] ?? '🎪'}</div>
                  }
                  {isClosed && (
                    <div style={styles.closedOverlay}>
                      <span style={styles.closedBadge}>모집 마감</span>
                    </div>
                  )}
                </div>
                <div style={styles.cardBody}>
                  <span style={styles.cardCat}>{club.category}</span>
                  <h3 style={styles.cardName}>{club.clubName}</h3>
                  <p style={styles.cardDesc}>
                    {club.description
                      ? club.description.slice(0, 50) + (club.description.length > 50 ? '...' : '')
                      : '소개글이 없습니다.'}
                  </p>
                  <div style={styles.cardBottom}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {club.tags?.slice(0, 2).map((t, i) => (
                        <span key={i} style={styles.tag}>{t.tagName}</span>
                      ))}
                    </div>
                    <span style={{ ...styles.memberInfo, color: isClosed ? '#ef4444' : '#6b7280' }}>
                      최대 {club.maxMembers}명
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: { background: 'linear-gradient(120deg, #ff6b35 0%, #ff9a5c 50%, #ffb347 100%)', padding: '56px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  bannerLeft: { flex: 1 },
  bannerTitle: { fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1.2, marginBottom: 10 },
  bannerDesc: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 24 },
  bannerSearch: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 100, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '6px 6px 6px 20px', maxWidth: 520, cursor: 'text' },
  bannerInput: { flex: 1, minWidth: 120, border: 'none', outline: 'none', fontSize: 14, color: '#333', background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, padding: '0 4px' },
  searchBtn: { padding: '10px 20px', background: '#ff6b35', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 100 },

  chipInclude: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, border: '1.5px solid #ff6b35', color: '#ff6b35', fontSize: 13, fontWeight: 600, background: '#fff0e8', cursor: 'pointer', userSelect: 'none' },
  chipExclude: { display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, border: '1.5px solid #ef4444', color: '#ef4444', fontSize: 13, fontWeight: 600, background: '#fef2f2', cursor: 'pointer', userSelect: 'none' },

  section: { padding: '32px 40px', maxWidth: 1200, margin: '0 auto' },
  sectionTitle: { fontSize: 20, fontWeight: 800, color: '#2d1b0e' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sortSelect: { padding: '8px 14px', border: '1.5px solid #ffe0d0', borderRadius: 8, fontSize: 13, color: '#7c5a4a', background: '#fff', cursor: 'pointer', outline: 'none' },

  popular: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 32 },
  popItem: { minWidth: 130, background: '#fff', borderRadius: 16, padding: 16, textAlign: 'center', border: '2px solid #ffe8db', cursor: 'pointer', transition: 'border-color 0.15s' },
  popItemActive: { border: '2px solid #ff6b35', background: '#fff0e8' },
  popEmoji: { fontSize: 36, marginBottom: 8 },
  popName: { fontSize: 13, fontWeight: 700, color: '#2d1b0e' },

  chips: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  chip: { padding: '8px 18px', borderRadius: 100, border: '2px solid #ffe0d0', background: '#fff', fontSize: 13, cursor: 'pointer', color: '#7c5a4a', fontWeight: 600 },
  chipActive: { background: '#ff6b35', color: '#fff', borderColor: '#ff6b35' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 20px rgba(255,107,53,0.08)', border: '2px solid #ffe8db', cursor: 'pointer', transition: 'all 0.2s' },
  cardImg: { position: 'relative', aspectRatio: '8/5', background: 'linear-gradient(135deg, #fff0e8, #ffe0cc)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  closedOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  closedBadge: { background: '#ef4444', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  cardBody: { padding: '16px 18px 18px' },
  cardCat: { display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#ff6b35', background: '#fff0e8', padding: '3px 10px', borderRadius: 100, marginBottom: 8 },
  cardName: { fontSize: 17, fontWeight: 800, marginBottom: 6, color: '#2d1b0e' },
  cardDesc: { fontSize: 13, color: '#7c5a4a', lineHeight: 1.5, marginBottom: 14 },
  cardBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  tag: { fontSize: 11, padding: '3px 8px', borderRadius: 100, background: '#fff0e8', color: '#ff6b35', fontWeight: 600 },
  memberInfo: { fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 4 },
};
