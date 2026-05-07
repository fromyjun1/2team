package com.club.part3.controller;

import com.club.part3.model.MatchResult;
import com.club.part3.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    // GET /api/match/{userId}  — 추천 결과 조회 (매칭 점수 계산 포함)
    @GetMapping("/{userId}")
    public ResponseEntity<List<MatchResult>> getRecommendations(@PathVariable Long userId) {
        return ResponseEntity.ok(matchService.recommend(userId));
    }

    // POST /api/match/{userId}/wishlist/{clubId}  — 찜하기
    @PostMapping("/{userId}/wishlist/{clubId}")
    public ResponseEntity<Void> addWishlist(@PathVariable Long userId,
                                            @PathVariable Long clubId) {
        matchService.addWishlist(userId, clubId);
        return ResponseEntity.ok().build();
    }

    // DELETE /api/match/{userId}/wishlist/{clubId}  — 찜 취소
    @DeleteMapping("/{userId}/wishlist/{clubId}")
    public ResponseEntity<Void> removeWishlist(@PathVariable Long userId,
                                               @PathVariable Long clubId) {
        matchService.removeWishlist(userId, clubId);
        return ResponseEntity.ok().build();
    }

    // GET /api/match/{userId}/wishlist  — 찜 목록 조회
    @GetMapping("/{userId}/wishlist")
    public ResponseEntity<List<MatchResult>> getWishlist(@PathVariable Long userId) {
        return ResponseEntity.ok(matchService.getWishlist(userId));
    }
}
