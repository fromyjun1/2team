package com.club.part4.controller;

import com.club.part4.service.MemberPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/member-posts")
@RequiredArgsConstructor
public class MemberPostController {

    private final MemberPostService memberPostService;

    // GET /api/member-posts/club/{clubId} — 게시글 목록 (멤버만)
    @GetMapping("/club/{clubId}")
    public ResponseEntity<?> getList(@PathVariable Long clubId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(memberPostService.getList(clubId, userId));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/member-posts — 글 작성 (멤버만)
    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(memberPostService.createPost(
                Long.valueOf(body.get("clubId").toString()),
                userId,
                (String) body.get("title"),
                (String) body.get("content")
            ));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/member-posts/{parentId}/reply — 댓글 작성 (멤버만)
    @PostMapping("/{parentId}/reply")
    public ResponseEntity<?> createReply(@PathVariable Long parentId,
                                         @RequestBody Map<String, Object> body,
                                         Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            return ResponseEntity.ok(memberPostService.createReply(parentId, userId, (String) body.get("content")));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/member-posts/{postId} — 글/댓글 삭제 (작성자/동아리장/ADMIN)
    @DeleteMapping("/{postId}")
    public ResponseEntity<?> delete(@PathVariable Long postId, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        try {
            memberPostService.delete(postId, userId);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }
}
