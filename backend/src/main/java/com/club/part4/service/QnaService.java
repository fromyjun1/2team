package com.club.part4.service;

import com.club.part4.model.QnaBoard;
import com.club.part4.repository.QnaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QnaService {

    private final QnaRepository qnaRepository;

    public List<QnaBoard> getList(Long clubId, Long currentUserId) {
        List<QnaBoard> all = qnaRepository.findByClubIdOrderByCreatedAt(clubId);
        List<QnaBoard> questions = all.stream()
            .filter(q -> q.getParentId() == null)
            .filter(q -> !"Y".equals(q.getIsSecret()) || q.getAuthorId().equals(currentUserId))
            .collect(Collectors.toList());
        questions.forEach(q -> {
            List<QnaBoard> replies = all.stream()
                .filter(r -> q.getQnaId().equals(r.getParentId()))
                .collect(Collectors.toList());
            q.setReplies(replies);
        });
        return questions;
    }

    @Transactional
    public QnaBoard createQuestion(Long clubId, Long authorId, String title, String content, boolean isSecret) {
        QnaBoard q = new QnaBoard();
        q.setClubId(clubId);
        q.setAuthorId(authorId);
        q.setTitle(title);
        q.setContent(content);
        q.setIsSecret(isSecret ? "Y" : "N");
        return qnaRepository.save(q);
    }

    @Transactional
    public QnaBoard createReply(Long parentId, Long authorId, String content) {
        QnaBoard parent = qnaRepository.findById(parentId)
            .orElseThrow(() -> new IllegalArgumentException("질문을 찾을 수 없습니다."));
        QnaBoard reply = new QnaBoard();
        reply.setClubId(parent.getClubId());
        reply.setAuthorId(authorId);
        reply.setParentId(parentId);
        reply.setContent(content);
        return qnaRepository.save(reply);
    }
}
