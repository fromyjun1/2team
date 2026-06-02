package com.club.part4.service;

import com.club.part1.model.User;
import com.club.part1.repository.UserRepository;
import com.club.part2.model.Club;
import com.club.part2.repository.ClubRepository;
import com.club.part4.model.QnaBoard;
import com.club.part4.repository.ApplicationRepository;
import com.club.part4.repository.QnaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QnaService {

    private final QnaRepository qnaRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final ApplicationRepository applicationRepository;

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

        // 작성자 이름 일괄 조회 (N+1 방지)
        Set<Long> authorIds = all.stream()
            .map(QnaBoard::getAuthorId)
            .collect(Collectors.toSet());
        Map<Long, String> nameMap = userRepository.findAllById(authorIds).stream()
            .collect(Collectors.toMap(u -> u.getUserId(), u -> u.getUserName()));

        // 이 동아리의 승인된 멤버 ID 목록
        Set<Long> memberIds = applicationRepository.findByClubIdAndStatus(clubId, "APPROVED")
            .stream()
            .map(a -> a.getUserId())
            .collect(Collectors.toSet());

        Long creatorId = clubRepository.findById(clubId)
            .map(c -> c.getCreatorId())
            .orElse(null);

        questions.forEach(q -> {
            q.setAuthorName(nameMap.getOrDefault(q.getAuthorId(), "알 수 없음"));
            q.setMember(memberIds.contains(q.getAuthorId()));
            q.setCreator(creatorId != null && creatorId.equals(q.getAuthorId()));
            q.getReplies().forEach(r -> {
                r.setAuthorName(nameMap.getOrDefault(r.getAuthorId(), "알 수 없음"));
                r.setMember(memberIds.contains(r.getAuthorId()));
                r.setCreator(creatorId != null && creatorId.equals(r.getAuthorId()));
            });
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

    @Transactional
    public void update(Long qnaId, Long requestUserId, String title, String content) {
        QnaBoard qna = qnaRepository.findById(qnaId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        checkPermission(qna, requestUserId);
        if (title != null) qna.setTitle(title);
        qna.setContent(content);
        qnaRepository.save(qna);
    }

    @Transactional
    public void delete(Long qnaId, Long requestUserId) {
        QnaBoard qna = qnaRepository.findById(qnaId)
            .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        checkPermission(qna, requestUserId);
        if (qna.getParentId() == null) {
            qnaRepository.deleteAll(qnaRepository.findByParentId(qnaId));
        }
        qnaRepository.delete(qna);
    }

    private void checkPermission(QnaBoard qna, Long requestUserId) {
        if (qna.getAuthorId().equals(requestUserId)) return;

        Club club = clubRepository.findById(qna.getClubId())
            .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다."));
        if (club.getCreatorId().equals(requestUserId)) return;

        User user = userRepository.findById(requestUserId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if ("ADMIN".equals(user.getRole())) return;

        throw new SecurityException("권한이 없습니다.");
    }
}
