package com.club.part4.controller;

import com.club.part4.model.QnaBoard;
import com.club.part4.service.QnaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/qna")
@RequiredArgsConstructor
public class QnaController {

    private final QnaService qnaService;

    // GET /api/qna/club/{clubId}  — 동아리 Q&A 목록 (비밀글은 작성자만)
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<QnaBoard>> getList(@PathVariable Long clubId) {
        Long currentUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(qnaService.getList(clubId, currentUserId));
    }

    // POST /api/qna  — 질문 작성 (JWT에서 authorId 추출)
    @PostMapping
    public ResponseEntity<QnaBoard> createQuestion(@RequestBody Map<String, Object> body) {
        Long authorId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(qnaService.createQuestion(
            Long.valueOf(body.get("clubId").toString()),
            authorId,
            (String) body.get("title"),
            (String) body.get("content"),
            "Y".equals(body.get("isSecret"))
        ));
    }

    // POST /api/qna/{parentId}/reply  — 답변 작성 (JWT에서 authorId 추출)
    @PostMapping("/{parentId}/reply")
    public ResponseEntity<QnaBoard> createReply(@PathVariable Long parentId,
                                                @RequestBody Map<String, Object> body) {
        Long authorId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(qnaService.createReply(
            parentId,
            authorId,
            (String) body.get("content")
        ));
    }
}
