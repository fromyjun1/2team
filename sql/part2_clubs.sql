-- =====================================================
-- [파트 2] 동아리 & 속성 데이터
-- 담당: 팀원 2
-- 테이블: CLUBS, CLUB_TAGS
-- =====================================================

DROP TABLE CLUB_TAGS CASCADE CONSTRAINTS;
DROP TABLE CLUBS CASCADE CONSTRAINTS;
DROP SEQUENCE SEQ_CLUB_ID;
DROP SEQUENCE SEQ_CLUB_TAG_ID;

CREATE SEQUENCE SEQ_CLUB_ID START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE SEQ_CLUB_TAG_ID START WITH 1 INCREMENT BY 1 NOCACHE;

-- CLUBS 테이블
CREATE TABLE CLUBS (
    CLUB_ID         NUMBER          DEFAULT SEQ_CLUB_ID.NEXTVAL PRIMARY KEY,
    CLUB_NAME       VARCHAR2(100)   NOT NULL UNIQUE,
    DESCRIPTION     VARCHAR2(2000),                     -- 소개글
    IMAGE_PATH      VARCHAR2(255),                      -- 대표 이미지 경로
    CATEGORY        VARCHAR2(50),                       -- 예: 문화/예술, 스포츠, 학술
    MAX_MEMBERS     NUMBER          DEFAULT 30,
    CONTACT_EMAIL   VARCHAR2(100),
    IS_ACTIVE       CHAR(1)         DEFAULT 'Y'
                    CHECK (IS_ACTIVE IN ('Y', 'N')),
    CREATED_AT      DATE            DEFAULT SYSDATE
);

COMMENT ON TABLE CLUBS IS '동아리 기본 정보';
COMMENT ON COLUMN CLUBS.IMAGE_PATH IS '/images/clubs/ 하위 파일명';

-- CLUB_TAGS 테이블 (동아리 속성 태그)
CREATE TABLE CLUB_TAGS (
    TAG_ID      NUMBER          DEFAULT SEQ_CLUB_TAG_ID.NEXTVAL PRIMARY KEY,
    CLUB_ID     NUMBER          NOT NULL,
    TAG_NAME    VARCHAR2(50)    NOT NULL,               -- 예: #음악, #정기공연, #초보환영
    CONSTRAINT FK_CLUB_TAG_CLUB FOREIGN KEY (CLUB_ID) REFERENCES CLUBS(CLUB_ID) ON DELETE CASCADE,
    CONSTRAINT UQ_CLUB_TAG UNIQUE (CLUB_ID, TAG_NAME)
);

COMMENT ON TABLE CLUB_TAGS IS '동아리 속성 태그';

-- =====================================================
-- 샘플 데이터
-- =====================================================

INSERT INTO CLUBS (CLUB_NAME, DESCRIPTION, IMAGE_PATH, CATEGORY, MAX_MEMBERS, CONTACT_EMAIL)
VALUES ('락밴드 소울', '기타, 베이스, 드럼으로 함께 연주하는 락밴드 동아리입니다.', 'soul_band.jpg', '문화/예술', 20, 'soul@school.ac.kr');

INSERT INTO CLUBS (CLUB_NAME, DESCRIPTION, IMAGE_PATH, CATEGORY, MAX_MEMBERS, CONTACT_EMAIL)
VALUES ('풋살클럽 FC한우', '매주 토요일 풋살을 즐기는 스포츠 동아리입니다. 실력 무관 환영!', 'fc_hanu.jpg', '스포츠', 25, 'fc@school.ac.kr');

INSERT INTO CLUBS (CLUB_NAME, DESCRIPTION, IMAGE_PATH, CATEGORY, MAX_MEMBERS, CONTACT_EMAIL)
VALUES ('코딩클럽 ByteMe', '알고리즘 스터디와 해커톤 참여를 목표로 하는 학술 동아리입니다.', 'byteme.jpg', '학술', 30, 'byteme@school.ac.kr');

-- 락밴드 소울 태그
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (1, '#음악');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (1, '#밴드');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (1, '#정기공연');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (1, '#주말활동');

-- 풋살클럽 태그
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (2, '#스포츠');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (2, '#친목');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (2, '#초보환영');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (2, '#주말활동');

-- 코딩클럽 태그
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (3, '#학술');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (3, '#스터디');
INSERT INTO CLUB_TAGS (CLUB_ID, TAG_NAME) VALUES (3, '#IT');

COMMIT;

-- =====================================================
-- 조회 확인
-- =====================================================
SELECT C.CLUB_NAME, CT.TAG_NAME
FROM CLUBS C
JOIN CLUB_TAGS CT ON C.CLUB_ID = CT.CLUB_ID
ORDER BY C.CLUB_ID, CT.TAG_NAME;
