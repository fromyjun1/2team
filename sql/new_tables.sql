-- ── 모집 상태 컬럼 추가 ───────────────────────────────
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_recruiting VARCHAR(1) DEFAULT 'Y';
UPDATE clubs SET is_recruiting = 'Y' WHERE is_recruiting IS NULL;

-- ── 공지사항 ──────────────────────────────────────────
CREATE SEQUENCE seq_notice_id START WITH 1 INCREMENT BY 1;

CREATE TABLE notices (
    notice_id  BIGINT      DEFAULT nextval('seq_notice_id') PRIMARY KEY,
    club_id    BIGINT      NOT NULL REFERENCES clubs(club_id)  ON DELETE CASCADE,
    author_id  BIGINT      NOT NULL REFERENCES users(user_id),
    title      VARCHAR(200) NOT NULL,
    content    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ── 멤버 게시판 ───────────────────────────────────────
CREATE SEQUENCE seq_member_post_id START WITH 1 INCREMENT BY 1;

CREATE TABLE member_posts (
    post_id    BIGINT       DEFAULT nextval('seq_member_post_id') PRIMARY KEY,
    club_id    BIGINT       NOT NULL REFERENCES clubs(club_id)  ON DELETE CASCADE,
    author_id  BIGINT       NOT NULL REFERENCES users(user_id),
    parent_id  BIGINT       REFERENCES member_posts(post_id) ON DELETE CASCADE,
    title      VARCHAR(200),
    content    VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
