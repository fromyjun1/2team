package com.club.part4.controller;

import com.club.part4.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    // GET /api/notices/club/{clubId} — 공지 목록 (멤버/동아리장만)
    @GetMapping("/club/{clubId}")
    public ResponseEntity<?> getList(@PathVariable Long clubId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(noticeService.getList(clubId, userId));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/notices — 공지 작성 (동아리장만)
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(noticeService.create(
                Long.valueOf(body.get("clubId").toString()),
                userId,
                (String) body.get("title"),
                (String) body.get("content")
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/notices/{noticeId} — 공지 삭제 (동아리장/ADMIN)
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<?> delete(@PathVariable Long noticeId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            noticeService.delete(noticeId, userId);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }
}
