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

    @Transactional(readOnly = true)
    public List<MatchResult> recommend(Long userId) {
        String sql = """
            SELECT c.club_id, c.club_name, c.description, c.image_path, c.category,
                   COUNT(ct.tag_name) AS match_count,
                   (SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id) AS total_tags,
                   ROUND(CAST(COUNT(ct.tag_name) * 100.0 AS numeric)
                       / NULLIF((SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id), 0), 1) AS score_pct,
                   CASE WHEN EXISTS (
                       SELECT 1 FROM wishlist WHERE user_id = ? AND club_id = c.club_id
                   ) THEN 1 ELSE 0 END AS is_wishlisted
            FROM clubs c
            JOIN club_tags ct ON c.club_id = ct.club_id
            WHERE ct.tag_name IN (SELECT tag_name FROM user_interests WHERE user_id = ?)
              AND c.is_active = 'Y'
            GROUP BY c.club_id, c.club_name, c.description, c.image_path, c.category
            ORDER BY score_pct DESC
            """;

        return jdbc.query(sql, (rs, row) -> new MatchResult(
            rs.getLong("club_id"),
            rs.getString("club_name"),
            rs.getString("description"),
            rs.getString("image_path"),
            rs.getString("category"),
            rs.getInt("match_count"),
            rs.getInt("total_tags"),
            rs.getDouble("score_pct"),
            rs.getInt("is_wishlisted") == 1
        ), userId, userId);
    }

    @Transactional
    public void addWishlist(Long userId, Long clubId) {
        jdbc.update("INSERT INTO wishlist (user_id, club_id) VALUES (?, ?) ON CONFLICT DO NOTHING", userId, clubId);
    }

    @Transactional
    public void removeWishlist(Long userId, Long clubId) {
        jdbc.update("DELETE FROM wishlist WHERE user_id = ? AND club_id = ?", userId, clubId);
    }

    @Transactional(readOnly = true)
    public List<MatchResult> getWishlist(Long userId) {
        String sql = """
            SELECT c.club_id, c.club_name, c.description, c.image_path, c.category,
                   COUNT(DISTINCT ct_match.tag_name) AS match_count,
                   (SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id) AS total_tags,
                   ROUND(CAST(COUNT(DISTINCT ct_match.tag_name) * 100.0 AS numeric)
                       / NULLIF((SELECT COUNT(*) FROM club_tags WHERE club_id = c.club_id), 0), 1) AS score_pct
            FROM wishlist w
            JOIN clubs c ON w.club_id = c.club_id
            LEFT JOIN club_tags ct_match ON ct_match.club_id = c.club_id
                AND ct_match.tag_name IN (SELECT tag_name FROM user_interests WHERE user_id = ?)
            WHERE w.user_id = ?
            GROUP BY c.club_id, c.club_name, c.description, c.image_path, c.category
            """;
        return jdbc.query(sql, (rs, row) -> new MatchResult(
            rs.getLong("club_id"), rs.getString("club_name"), rs.getString("description"),
            rs.getString("image_path"), rs.getString("category"),
            rs.getInt("match_count"), rs.getInt("total_tags"), rs.getDouble("score_pct"), true
        ), userId, userId);
    }
}
