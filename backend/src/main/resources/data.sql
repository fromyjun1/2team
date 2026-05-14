-- 샘플 데이터 (초기 1회만 실행)
INSERT INTO users (user_email, user_pw, user_name, student_no, department) VALUES
  ('alice@school.ac.kr', 'hashed_pw_1', '김앨리스', '20230001', '컴퓨터공학과')
ON CONFLICT (user_email) DO NOTHING;

INSERT INTO users (user_email, user_pw, user_name, student_no, department) VALUES
  ('bob@school.ac.kr', 'hashed_pw_2', '이밥', '20230002', '경영학과')
ON CONFLICT (user_email) DO NOTHING;

INSERT INTO users (user_email, user_pw, user_name, student_no, department, role) VALUES
  ('admin@school.ac.kr', 'hashed_pw_admin', '관리자', '00000000', '학생처', 'ADMIN')
ON CONFLICT (user_email) DO NOTHING;

INSERT INTO clubs (club_name, description, image_path, category, max_members, contact_email) VALUES
  ('락밴드 소울', '기타, 베이스, 드럼으로 함께 연주하는 락밴드 동아리입니다.', 'soul_band.jpg', '문화/예술', 20, 'soul@school.ac.kr')
ON CONFLICT (club_name) DO NOTHING;

INSERT INTO clubs (club_name, description, image_path, category, max_members, contact_email) VALUES
  ('풋살클럽 FC한우', '매주 토요일 풋살을 즐기는 스포츠 동아리입니다. 실력 무관 환영!', 'fc_hanu.jpg', '스포츠', 25, 'fc@school.ac.kr')
ON CONFLICT (club_name) DO NOTHING;

INSERT INTO clubs (club_name, description, image_path, category, max_members, contact_email) VALUES
  ('코딩클럽 ByteMe', '알고리즘 스터디와 해커톤 참여를 목표로 하는 학술 동아리입니다.', 'byteme.jpg', '학술', 30, 'byteme@school.ac.kr')
ON CONFLICT (club_name) DO NOTHING;

INSERT INTO club_tags (club_id, tag_name) VALUES (1,'#음악'),(1,'#밴드'),(1,'#정기공연'),(1,'#주말활동') ON CONFLICT DO NOTHING;
INSERT INTO club_tags (club_id, tag_name) VALUES (2,'#스포츠'),(2,'#친목'),(2,'#초보환영'),(2,'#주말활동') ON CONFLICT DO NOTHING;
INSERT INTO club_tags (club_id, tag_name) VALUES (3,'#학술'),(3,'#스터디'),(3,'#IT') ON CONFLICT DO NOTHING;

INSERT INTO user_interests (user_id, tag_name) VALUES (1,'#밴드'),(1,'#음악'),(1,'#주말활동') ON CONFLICT DO NOTHING;
INSERT INTO user_interests (user_id, tag_name) VALUES (2,'#친목'),(2,'#스포츠'),(2,'#초보환영') ON CONFLICT DO NOTHING;

INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) VALUES (1,1,3,4,75.0) ON CONFLICT DO NOTHING;
INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) VALUES (1,2,1,4,25.0) ON CONFLICT DO NOTHING;
INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) VALUES (2,2,3,4,75.0) ON CONFLICT DO NOTHING;

INSERT INTO wishlist (user_id, club_id) VALUES (1,1) ON CONFLICT DO NOTHING;

INSERT INTO applications (user_id, club_id, motivation, status) VALUES
  (1, 1, '음악을 좋아하고 밴드 활동을 통해 다양한 친구들과 교류하고 싶습니다.', 'PENDING')
ON CONFLICT DO NOTHING;

INSERT INTO qna_board (club_id, author_id, parent_id, title, content, is_secret) VALUES
  (1, 1, NULL, '악기를 처음 배우는데 지원 가능한가요?', '기타를 배운 지 3개월 됐는데 지원해도 될까요?', 'N');
