package com.club.part3.service;

import com.club.part3.model.MatchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchService {

    private final JdbcTemplate jdbc;

    // Oracle MERGE로 점수 갱신 후 결과 반환
    // Oracle은 USING 서브쿼리 내 ? 바인딩을 지원하지 않으므로 userId를 문자열로 직접 삽입
    @Transactional
    public List<MatchResult> recommend(Long userId) {
        String mergeSql =
            "MERGE INTO MATCH_SCORES MS " +
            "USING ( " +
            "    SELECT " + userId + " AS USER_ID, C.CLUB_ID, " +
            "           COUNT(CT.TAG_NAME) AS MATCH_COUNT, " +
            "           (SELECT COUNT(*) FROM CLUB_TAGS WHERE CLUB_ID = C.CLUB_ID) AS TOTAL_TAGS, " +
            "           ROUND(COUNT(CT.TAG_NAME) * 100.0 " +
            "               / NULLIF((SELECT COUNT(*) FROM CLUB_TAGS WHERE CLUB_ID = C.CLUB_ID), 0), 1) AS SCORE_PCT " +
            "    FROM CLUBS C " +
            "    JOIN CLUB_TAGS CT ON C.CLUB_ID = CT.CLUB_ID " +
            "    WHERE CT.TAG_NAME IN (SELECT TAG_NAME FROM USER_INTERESTS WHERE USER_ID = " + userId + ") " +
            "      AND C.IS_ACTIVE = 'Y' " +
            "    GROUP BY C.CLUB_ID " +
            ") SRC ON (MS.USER_ID = SRC.USER_ID AND MS.CLUB_ID = SRC.CLUB_ID) " +
            "WHEN MATCHED THEN " +
            "    UPDATE SET MS.MATCH_COUNT = SRC.MATCH_COUNT, MS.TOTAL_TAGS = SRC.TOTAL_TAGS, " +
            "               MS.SCORE_PCT = SRC.SCORE_PCT, MS.CALCULATED_AT = SYSDATE " +
            "WHEN NOT MATCHED THEN " +
            "    INSERT (USER_ID, CLUB_ID, MATCH_COUNT, TOTAL_TAGS, SCORE_PCT) " +
            "    VALUES (SRC.USER_ID, SRC.CLUB_ID, SRC.MATCH_COUNT, SRC.TOTAL_TAGS, SRC.SCORE_PCT)";
        jdbc.update(mergeSql);

        String selectSql = """
            SELECT MS.CLUB_ID, C.CLUB_NAME, C.DESCRIPTION, C.IMAGE_PATH, C.CATEGORY,
                   MS.MATCH_COUNT, MS.TOTAL_TAGS, MS.SCORE_PCT,
                   CASE WHEN W.WISH_ID IS NOT NULL THEN 1 ELSE 0 END AS IS_WISHLISTED
            FROM MATCH_SCORES MS
            JOIN CLUBS C ON MS.CLUB_ID = C.CLUB_ID
            LEFT JOIN WISHLIST W ON W.USER_ID = MS.USER_ID AND W.CLUB_ID = MS.CLUB_ID
            WHERE MS.USER_ID = ?
            ORDER BY MS.SCORE_PCT DESC
            """;

        return jdbc.query(selectSql, (rs, row) -> new MatchResult(
            rs.getLong("CLUB_ID"),
            rs.getString("CLUB_NAME"),
            rs.getString("DESCRIPTION"),
            rs.getString("IMAGE_PATH"),
            rs.getString("CATEGORY"),
            rs.getInt("MATCH_COUNT"),
            rs.getInt("TOTAL_TAGS"),
            rs.getDouble("SCORE_PCT"),
            rs.getInt("IS_WISHLISTED") == 1
        ), userId);
    }

    @Transactional
    public void addWishlist(Long userId, Long clubId) {
        jdbc.update("INSERT INTO WISHLIST (USER_ID, CLUB_ID) VALUES (?, ?)", userId, clubId);
    }

    @Transactional
    public void removeWishlist(Long userId, Long clubId) {
        jdbc.update("DELETE FROM WISHLIST WHERE USER_ID = ? AND CLUB_ID = ?", userId, clubId);
    }

    public List<MatchResult> getWishlist(Long userId) {
        String sql = """
            SELECT C.CLUB_ID, C.CLUB_NAME, C.DESCRIPTION, C.IMAGE_PATH, C.CATEGORY,
                   NVL(MS.MATCH_COUNT, 0), NVL(MS.TOTAL_TAGS, 0), NVL(MS.SCORE_PCT, 0), 1
            FROM WISHLIST W
            JOIN CLUBS C ON W.CLUB_ID = C.CLUB_ID
            LEFT JOIN MATCH_SCORES MS ON MS.USER_ID = W.USER_ID AND MS.CLUB_ID = W.CLUB_ID
            WHERE W.USER_ID = ?
            """;
        return jdbc.query(sql, (rs, row) -> new MatchResult(
            rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5),
            rs.getInt(6), rs.getInt(7), rs.getDouble(8), true
        ), userId);
    }
}
