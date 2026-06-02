package com.club.part4.controller;

import com.club.part2.service.ClubService;
import com.club.part4.model.Application;
import com.club.part4.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final ClubService clubService;

    // POST /api/applications — 가입 신청
    @PostMapping
    public ResponseEntity<Application> apply(@RequestBody Map<String, Object> body) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long clubId = Long.valueOf(body.get("clubId").toString());
        String motivation = (String) body.get("motivation");
        return ResponseEntity.ok(applicationService.apply(userId, clubId, motivation));
    }

    // GET /api/applications/user/{userId} — 내 신청 현황 (본인만)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getMyApplications(@PathVariable Long userId) {
        Long currentUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!currentUserId.equals(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(applicationService.getByUser(userId));
    }

    // GET /api/applications/club/{clubId} — 동아리 신청자 목록 (글로벌 ADMIN 또는 해당 클럽 관리자)
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<Map<String, Object>>> getClubApplications(@PathVariable Long clubId,
                                                                          Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        boolean isAdmin    = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isClubAdmin = clubService.isClubAdmin(clubId, userId);
        if (!isAdmin && !isClubAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.<List<Map<String, Object>>>ok(applicationService.getByClub(clubId));
    }

    // PATCH /api/applications/{appId}/status — 승인/거절 (글로벌 ADMIN 또는 해당 클럽 관리자)
    @PatchMapping("/{appId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long appId,
                                             @RequestBody Map<String, String> body,
                                             Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Long clubId = applicationService.getById(appId).getClubId();
        boolean isAdmin     = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isClubAdmin = clubService.isClubAdmin(clubId, userId);
        if (!isAdmin && !isClubAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        applicationService.updateStatus(appId, body.get("status"), body.get("comment"));
        return ResponseEntity.ok().build();
    }

    // GET /api/applications/club/{clubId}/count — 승인된 멤버 수
    @GetMapping("/club/{clubId}/count")
    public ResponseEntity<Map<String, Long>> getMemberCount(@PathVariable Long clubId) {
        return ResponseEntity.ok(Map.of("count", applicationService.getMemberCount(clubId)));
    }

    // DELETE /api/applications/club/{clubId}/leave — 동아리 탈퇴 (본인만)
    @DeleteMapping("/club/{clubId}/leave")
    public ResponseEntity<Void> leaveClub(@PathVariable Long clubId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        try {
            applicationService.leaveClub(userId, clubId);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // POST /api/applications/reapply — 재신청 (거절/탈퇴 후)
    @PostMapping("/reapply")
    public ResponseEntity<?> reapply(@RequestBody Map<String, Object> body, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Long clubId = Long.valueOf(body.get("clubId").toString());
        String motivation = (String) body.get("motivation");
        try {
            return ResponseEntity.ok(applicationService.reapply(userId, clubId, motivation));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }
}
