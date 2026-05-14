-- =====================================================
-- [파트 1] 사용자 & 취향 데이터
-- 담당: 팀원 1
-- 테이블: users, user_interests
-- DB: PostgreSQL (Google Cloud SQL)
-- =====================================================

DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP SEQUENCE IF EXISTS seq_user_id;
DROP SEQUENCE IF EXISTS seq_interest_id;

CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_interest_id START WITH 1 INCREMENT BY 1;

CREATE TABLE users (
    user_id     BIGINT          DEFAULT nextval('seq_user_id') PRIMARY KEY,
    user_email  VARCHAR(100)    NOT NULL UNIQUE,
    user_pw     VARCHAR(255)    NOT NULL,
    user_name   VARCHAR(50)     NOT NULL,
    student_no  VARCHAR(20),
    department  VARCHAR(100),
    role        VARCHAR(10)     DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS '회원 기본 정보';
COMMENT ON COLUMN users.role IS 'USER=일반회원, ADMIN=관리자';

CREATE TABLE user_interests (
    interest_id BIGINT          DEFAULT nextval('seq_interest_id') PRIMARY KEY,
    user_id     BIGINT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tag_name    VARCHAR(50)     NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_tag UNIQUE (user_id, tag_name)
);

COMMENT ON TABLE user_interests IS '사용자가 선택한 관심 태그';

-- =====================================================
-- 샘플 데이터
-- =====================================================

INSERT INTO users (user_email, user_pw, user_name, student_no, department)
VALUES ('alice@school.ac.kr', 'hashed_pw_1', '김앨리스', '20230001', '컴퓨터공학과');

INSERT INTO users (user_email, user_pw, user_name, student_no, department)
VALUES ('bob@school.ac.kr', 'hashed_pw_2', '이밥', '20230002', '경영학과');

INSERT INTO users (user_email, user_pw, user_name, student_no, department, role)
VALUES ('admin@school.ac.kr', 'hashed_pw_admin', '관리자', '00000000', '학생처', 'ADMIN');

INSERT INTO user_interests (user_id, tag_name) VALUES (1, '#밴드');
INSERT INTO user_interests (user_id, tag_name) VALUES (1, '#음악');
INSERT INTO user_interests (user_id, tag_name) VALUES (1, '#주말활동');
INSERT INTO user_interests (user_id, tag_name) VALUES (2, '#친목');
INSERT INTO user_interests (user_id, tag_name) VALUES (2, '#스포츠');
INSERT INTO user_interests (user_id, tag_name) VALUES (2, '#초보환영');

-- =====================================================
-- 조회 확인
-- =====================================================
SELECT u.user_name, ui.tag_name
FROM users u
JOIN user_interests ui ON u.user_id = ui.user_id
ORDER BY u.user_id, ui.tag_name;
