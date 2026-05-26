-- =====================================================
-- [파트 2] 동아리 & 속성 데이터
-- 담당: 팀원 2
-- 테이블: clubs, club_tags
-- DB: PostgreSQL (Google Cloud SQL)
-- =====================================================

DROP TABLE IF EXISTS club_tags CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP SEQUENCE IF EXISTS seq_club_id;
DROP SEQUENCE IF EXISTS seq_club_tag_id;

CREATE SEQUENCE seq_club_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_club_tag_id START WITH 1 INCREMENT BY 1;

CREATE TABLE clubs (
    club_id         BIGINT          DEFAULT nextval('seq_club_id') PRIMARY KEY,
    club_name       VARCHAR(100)    NOT NULL UNIQUE,
    description     VARCHAR(2000),
    image_path      VARCHAR(255),
    category        VARCHAR(50),
    max_members     INTEGER         DEFAULT 30,
    contact_email   VARCHAR(100),
    is_active       CHAR(1)         DEFAULT 'Y' CHECK (is_active IN ('Y', 'N')),
    creator_id      BIGINT          REFERENCES users(user_id) ON DELETE SET NULL,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clubs IS '동아리 기본 정보';
COMMENT ON COLUMN clubs.image_path IS '/images/clubs/ 하위 파일명';

CREATE TABLE club_tags (
    tag_id      BIGINT          DEFAULT nextval('seq_club_tag_id') PRIMARY KEY,
    club_id     BIGINT          NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    tag_name    VARCHAR(50)     NOT NULL,
    CONSTRAINT uq_club_tag UNIQUE (club_id, tag_name)
);

COMMENT ON TABLE club_tags IS '동아리 속성 태그';

-- =====================================================
-- 샘플 데이터
-- =====================================================

INSERT INTO clubs (club_name, description, image_path, category, max_members, contact_email)
VALUES ('락밴드 소울', '기타, 베이스, 드럼으로 함께 연주하는 락밴드 동아리입니다.', 'soul_band.jpg', '문화/예술', 20, 'soul@school.ac.kr');

INSERT INTO clubs (club_name, description, image_path, category, max_members, contact_email)
VALUES ('풋살클럽 FC한우', '매주 토요일 풋살을 즐기는 스포츠 동아리입니다. 실력 무관 환영!', 'fc_hanu.jpg', '스포츠', 25, 'fc@school.ac.kr');

INSERT INTO clubs (club_name, description, image_path, category, max_members, contact_email)
VALUES ('코딩클럽 ByteMe', '알고리즘 스터디와 해커톤 참여를 목표로 하는 학술 동아리입니다.', 'byteme.jpg', '학술', 30, 'byteme@school.ac.kr');

INSERT INTO club_tags (club_id, tag_name) VALUES (1, '#음악');
INSERT INTO club_tags (club_id, tag_name) VALUES (1, '#밴드');
INSERT INTO club_tags (club_id, tag_name) VALUES (1, '#정기공연');
INSERT INTO club_tags (club_id, tag_name) VALUES (1, '#주말활동');

INSERT INTO club_tags (club_id, tag_name) VALUES (2, '#스포츠');
INSERT INTO club_tags (club_id, tag_name) VALUES (2, '#친목');
INSERT INTO club_tags (club_id, tag_name) VALUES (2, '#초보환영');
INSERT INTO club_tags (club_id, tag_name) VALUES (2, '#주말활동');

INSERT INTO club_tags (club_id, tag_name) VALUES (3, '#학술');
INSERT INTO club_tags (club_id, tag_name) VALUES (3, '#스터디');
INSERT INTO club_tags (club_id, tag_name) VALUES (3, '#IT');

-- =====================================================
-- 조회 확인
-- =====================================================
SELECT c.club_name, ct.tag_name
FROM clubs c
JOIN club_tags ct ON c.club_id = ct.club_id
ORDER BY c.club_id, ct.tag_name;
