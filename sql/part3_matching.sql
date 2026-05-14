-- =====================================================
-- [파트 3] 매칭 로직 & 추천 결과
-- 담당: 팀원 3
-- 테이블: match_scores, wishlist
-- 의존: users(part1), clubs(part2), user_interests(part1), club_tags(part2)
-- DB: PostgreSQL (Google Cloud SQL)
-- =====================================================

DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS match_scores CASCADE;
DROP SEQUENCE IF EXISTS seq_match_id;
DROP SEQUENCE IF EXISTS seq_wish_id;

CREATE SEQUENCE seq_match_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_wish_id  START WITH 1 INCREMENT BY 1;

CREATE TABLE match_scores (
    match_id        BIGINT          DEFAULT nextval('seq_match_id') PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id         BIGINT          NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    match_count     INTEGER         DEFAULT 0,
    total_tags      INTEGER         DEFAULT 0,
    score_pct       NUMERIC(5,2)    DEFAULT 0,
    calculated_at   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_match UNIQUE (user_id, club_id)
);

COMMENT ON TABLE match_scores IS '사용자-동아리 태그 매칭 점수 캐시';
COMMENT ON COLUMN match_scores.score_pct IS '(일치 태그 수 / 동아리 전체 태그 수) * 100';

CREATE TABLE wishlist (
    wish_id     BIGINT  DEFAULT nextval('seq_wish_id') PRIMARY KEY,
    user_id     BIGINT  NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id     BIGINT  NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wishlist UNIQUE (user_id, club_id)
);

COMMENT ON TABLE wishlist IS '사용자 찜 목록';

-- =====================================================
-- 핵심 매칭 알고리즘 (PostgreSQL)
-- =====================================================

-- [쿼리 A] 특정 사용자에 대한 실시간 매칭 점수 계산 ($1 = user_id)
-- SELECT c.club_id, c.club_name, c.category,
--        COUNT(ct.tag_name) AS match_count,
--        (SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id) AS total_tags,
--        ROUND(
--            COUNT(ct.tag_name) * 100.0
--            / NULLIF((SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id), 0), 1
--        ) AS score_pct
-- FROM clubs c
-- JOIN club_tags ct ON c.club_id = ct.club_id
-- WHERE ct.tag_name IN (SELECT tag_name FROM user_interests WHERE user_id = $1)
--   AND c.is_active = 'Y'
-- GROUP BY c.club_id, c.club_name, c.category
-- ORDER BY score_pct DESC, match_count DESC;

-- [쿼리 B] 매칭 결과 저장/갱신 (PostgreSQL UPSERT)
-- INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct)
-- SELECT $1, c.club_id, COUNT(ct.tag_name), ...
-- FROM clubs c JOIN club_tags ct ON c.club_id = ct.club_id
-- WHERE ...
-- ON CONFLICT (user_id, club_id) DO UPDATE SET
--     match_count = EXCLUDED.match_count,
--     score_pct   = EXCLUDED.score_pct,
--     calculated_at = CURRENT_TIMESTAMP;

-- [쿼리 C] Q&A 계층형 조회 (PostgreSQL WITH RECURSIVE)
-- WITH RECURSIVE qna_tree AS (
--     SELECT * FROM qna_board WHERE club_id = $1 AND parent_id IS NULL
--     UNION ALL
--     SELECT q.* FROM qna_board q JOIN qna_tree t ON q.parent_id = t.qna_id
-- )
-- SELECT qt.*, u.user_name FROM qna_tree qt
-- JOIN users u ON qt.author_id = u.user_id
-- ORDER BY qt.qna_id, qt.created_at;

-- =====================================================
-- 샘플 데이터 (part1, part2 실행 후 실행)
-- =====================================================

INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) VALUES (1, 1, 3, 4, 75.0);
INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) VALUES (1, 2, 1, 4, 25.0);
INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) VALUES (2, 2, 3, 4, 75.0);

INSERT INTO wishlist (user_id, club_id) VALUES (1, 1);
