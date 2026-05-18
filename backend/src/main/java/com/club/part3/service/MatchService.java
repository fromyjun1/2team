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

    @Transactional
    public List<MatchResult> recommend(Long userId) {
        // PostgreSQL: MERGE 대신 INSERT ... ON CONFLICT DO UPDATE 사용
        String upsertSql =
            "INSERT INTO match_scores (user_id, club_id, match_count, total_tags, score_pct) " +
            "SELECT ?, c.club_id, " +
            "       COUNT(ct.tag_name), " +
            "       (SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id), " +
            "       ROUND(CAST(COUNT(ct.tag_name) * 100.0 AS numeric) " +
            "           / NULLIF((SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id), 0), 1) " +
            "FROM clubs c " +
            "JOIN club_tags ct ON c.club_id = ct.club_id " +
            "WHERE ct.tag_name IN (SELECT tag_name FROM user_interests WHERE user_id = ?) " +
            "  AND c.is_active = 'Y' " +
            "GROUP BY c.club_id " +
            "ON CONFLICT (user_id, club_id) DO UPDATE SET " +
            "    match_count = EXCLUDED.match_count, " +
            "    total_tags = EXCLUDED.total_tags, " +
            "    score_pct = EXCLUDED.score_pct, " +
            "    calculated_at = CURRENT_TIMESTAMP";
        jdbc.update(upsertSql, userId, userId);

        String selectSql = """
            SELECT ms.club_id, c.club_name, c.description, c.image_path, c.category,
                   ms.match_count, ms.total_tags, ms.score_pct,
                   CASE WHEN w.wish_id IS NOT NULL THEN 1 ELSE 0 END AS is_wishlisted
            FROM match_scores ms
            JOIN clubs c ON ms.club_id = c.club_id
            LEFT JOIN wishlist w ON w.user_id = ms.user_id AND w.club_id = ms.club_id
            WHERE ms.user_id = ?
            ORDER BY ms.score_pct DESC
            """;

        return jdbc.query(selectSql, (rs, row) -> new MatchResult(
            rs.getLong("club_id"),
            rs.getString("club_name"),
            rs.getString("description"),
            rs.getString("image_path"),
            rs.getString("category"),
            rs.getInt("match_count"),
            rs.getInt("total_tags"),
            rs.getDouble("score_pct"),
            rs.getInt("is_wishlisted") == 1
        ), userId);
    }

    @Transactional
    public void addWishlist(Long userId, Long clubId) {
        jdbc.update("INSERT INTO wishlist (user_id, club_id) VALUES (?, ?) ON CONFLICT DO NOTHING", userId, clubId);
    }

    @Transactional
    public void removeWishlist(Long userId, Long clubId) {
        jdbc.update("DELETE FROM wishlist WHERE user_id = ? AND club_id = ?", userId, clubId);
    }

    public List<MatchResult> getWishlist(Long userId) {
        String sql = """
            SELECT c.club_id, c.club_name, c.description, c.image_path, c.category,
                   COALESCE(ms.match_count, 0), COALESCE(ms.total_tags, 0), COALESCE(ms.score_pct, 0), 1
            FROM wishlist w
            JOIN clubs c ON w.club_id = c.club_id
            LEFT JOIN match_scores ms ON ms.user_id = w.user_id AND ms.club_id = w.club_id
            WHERE w.user_id = ?
            """;
        return jdbc.query(sql, (rs, row) -> new MatchResult(
            rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5),
            rs.getInt(6), rs.getInt(7), rs.getDouble(8), true
        ), userId);
    }
}
