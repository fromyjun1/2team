-- =====================================================
-- [파트 4] 커뮤니티 & 신청 관리
-- 담당: 팀원 4
-- 테이블: applications, qna_board
-- 의존: users(part1), clubs(part2)
-- DB: PostgreSQL (Google Cloud SQL)
-- =====================================================

DROP TABLE IF EXISTS qna_board CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP SEQUENCE IF EXISTS seq_app_id;
DROP SEQUENCE IF EXISTS seq_qna_id;

CREATE SEQUENCE seq_app_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_qna_id START WITH 1 INCREMENT BY 1;

CREATE TABLE applications (
    app_id          BIGINT          DEFAULT nextval('seq_app_id') PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id         BIGINT          NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    motivation      VARCHAR(1000)   NOT NULL,
    status          VARCHAR(10)     DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    applied_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    reviewed_at     TIMESTAMP,
    review_comment  VARCHAR(500),
    CONSTRAINT uq_app UNIQUE (user_id, club_id)
);

COMMENT ON TABLE applications IS '동아리 가입 신청서';
COMMENT ON COLUMN applications.status IS 'PENDING=대기, APPROVED=승인, REJECTED=거절';

CREATE TABLE qna_board (
    qna_id      BIGINT          DEFAULT nextval('seq_qna_id') PRIMARY KEY,
    club_id     BIGINT          NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    author_id   BIGINT          NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_id   BIGINT          REFERENCES qna_board(qna_id) ON DELETE CASCADE,
    title       VARCHAR(200),
    content     VARCHAR(2000)   NOT NULL,
    is_secret   CHAR(1)         DEFAULT 'N' CHECK (is_secret IN ('Y', 'N')),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE qna_board IS '동아리별 Q&A 게시판 (계층형: parent_id로 답변 연결)';
COMMENT ON COLUMN qna_board.parent_id IS 'NULL이면 질문, 값이 있으면 해당 qna_id의 답변';

-- =====================================================
-- 샘플 데이터
-- =====================================================

INSERT INTO applications (user_id, club_id, motivation, status)
VALUES (1, 1, '음악을 좋아하고 밴드 활동을 통해 다양한 친구들과 교류하고 싶습니다.', 'PENDING');

INSERT INTO applications (user_id, club_id, motivation, status)
VALUES (2, 2, '평소 풋살을 즐기며 운동을 통해 활발한 대학 생활을 하고 싶습니다.', 'APPROVED');

INSERT INTO qna_board (club_id, author_id, parent_id, title, content, is_secret)
VALUES (1, 1, NULL, '악기를 처음 배우는데 지원 가능한가요?', '기타를 배운 지 3개월 됐는데 지원해도 될까요?', 'N');

INSERT INTO qna_board (club_id, author_id, parent_id, title, content, is_secret)
VALUES (1, 3, 1, NULL, '네! 초보자도 환영합니다. 함께 성장해요 :)', 'N');

-- =====================================================
-- 유용한 조회 쿼리
-- =====================================================

-- [Q1] 신청 현황 대시보드 ($1 = user_id)
-- SELECT a.app_id, c.club_name, a.status, a.applied_at, a.reviewed_at, a.review_comment
-- FROM applications a
-- JOIN clubs c ON a.club_id = c.club_id
-- WHERE a.user_id = $1
-- ORDER BY a.applied_at DESC;

-- [Q2] 동아리 관리자용 신청자 목록 ($1 = club_id)
-- SELECT a.app_id, u.user_name, u.student_no, u.department, a.motivation, a.status, a.applied_at
-- FROM applications a
-- JOIN users u ON a.user_id = u.user_id
-- WHERE a.club_id = $1
-- ORDER BY a.applied_at;

-- [Q3] Q&A 계층형 조회 (PostgreSQL WITH RECURSIVE, $1 = club_id)
-- WITH RECURSIVE qna_tree AS (
--     SELECT * FROM qna_board WHERE club_id = $1 AND parent_id IS NULL
--     UNION ALL
--     SELECT q.* FROM qna_board q JOIN qna_tree t ON q.parent_id = t.qna_id
-- )
-- SELECT qt.qna_id, qt.parent_id, u.user_name,
--        CASE WHEN qt.parent_id IS NULL THEN qt.title ELSE '  └ 답변' END AS display_title,
--        qt.content, qt.is_secret, qt.created_at
-- FROM qna_tree qt
-- JOIN users u ON qt.author_id = u.user_id
-- ORDER BY qt.qna_id, qt.created_at;
