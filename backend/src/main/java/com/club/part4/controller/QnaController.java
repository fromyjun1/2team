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

    // PUT /api/qna/{qnaId}  — 게시글 수정 (작성자 / 동아리장 / ADMIN)
    @PutMapping("/{qnaId}")
    public ResponseEntity<Void> update(@PathVariable Long qnaId,
                                       @RequestBody Map<String, Object> body) {
        Long requestUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        try {
            qnaService.update(qnaId, requestUserId,
                (String) body.get("title"),
                (String) body.get("content"));
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }
    }

    // DELETE /api/qna/{qnaId}  — 게시글 삭제 (작성자 / 동아리장 / ADMIN, 질문 삭제 시 답변도 함께 삭제)
    @DeleteMapping("/{qnaId}")
    public ResponseEntity<Void> delete(@PathVariable Long qnaId) {
        Long requestUserId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        try {
            qnaService.delete(qnaId, requestUserId);
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).build();
        }
    }
}
