package com.club.part4.controller;

import com.club.part4.model.Application;
import com.club.part4.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    // POST /api/applications  — 가입 신청
    @PostMapping
    public ResponseEntity<Application> apply(@RequestBody Map<String, Object> body) {
        Long userId  = Long.valueOf(body.get("userId").toString());
        Long clubId  = Long.valueOf(body.get("clubId").toString());
        String motivation = (String) body.get("motivation");
        return ResponseEntity.ok(applicationService.apply(userId, clubId, motivation));
    }

    // GET /api/applications/user/{userId}  — 내 신청 현황
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Application>> getMyApplications(@PathVariable Long userId) {
        return ResponseEntity.ok(applicationService.getByUser(userId));
    }

    // GET /api/applications/club/{clubId}  — 동아리 신청자 목록 (ADMIN)
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<Application>> getClubApplications(@PathVariable Long clubId) {
        return ResponseEntity.ok(applicationService.getByClub(clubId));
    }

    // PATCH /api/applications/{appId}/status  — 승인/거절 (ADMIN)
    @PatchMapping("/{appId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long appId,
                                             @RequestBody Map<String, String> body) {
        applicationService.updateStatus(appId, body.get("status"), body.get("comment"));
        return ResponseEntity.ok().build();
    }
}
