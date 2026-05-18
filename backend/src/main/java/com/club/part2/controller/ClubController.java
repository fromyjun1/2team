package com.club.part2.controller;

import com.club.part2.model.Club;
import com.club.part2.service.ClubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    // GET /api/clubs  — 전체 목록 (카드 갤러리)
    @GetMapping
    public ResponseEntity<List<Club>> getAllClubs(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(clubService.getClubs(category));
    }

    // GET /api/clubs/{clubId}  — 상세 정보
    @GetMapping("/{clubId}")
    public ResponseEntity<Club> getClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(clubService.getClub(clubId));
    }

    // POST /api/clubs  — 동아리 등록 (ADMIN 전용)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Club> createClub(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(clubService.createClub(body));
    }

    // PUT /api/clubs/{clubId}/tags  — 태그 수정 (ADMIN 전용)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{clubId}/tags")
    public ResponseEntity<Void> updateTags(@PathVariable Long clubId,
                                           @RequestBody List<String> tags) {
        clubService.updateTags(clubId, tags);
        return ResponseEntity.ok().build();
    }
}
