package com.club.part4.service;

import com.club.part1.repository.UserRepository;
import com.club.part2.repository.ClubRepository;
import com.club.part4.model.Notice;
import com.club.part4.repository.ApplicationRepository;
import com.club.part4.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;

    public List<Notice> getList(Long clubId, Long requestUserId) {
        boolean isMember = applicationRepository
            .findByUserIdAndClubId(requestUserId, clubId)
            .map(a -> "APPROVED".equals(a.getStatus()))
            .orElse(false);
        boolean isCreator = clubRepository.findById(clubId)
            .map(c -> c.getCreatorId().equals(requestUserId))
            .orElse(false);
        if (!isMember && !isCreator) {
            throw new SecurityException("멤버만 공지사항을 볼 수 있습니다.");
        }
        List<Notice> notices = noticeRepository.findByClubIdOrderByCreatedAtDesc(clubId);
        notices.forEach(n -> n.setAuthorName(
            userRepository.findById(n.getAuthorId()).map(u -> u.getUserName()).orElse("알 수 없음")
        ));
        return notices;
    }

    @Transactional
    public Notice create(Long clubId, Long authorId, String title, String content) {
        boolean isCreator = clubRepository.findById(clubId)
            .map(c -> c.getCreatorId().equals(authorId))
            .orElse(false);
        if (!isCreator) throw new SecurityException("동아리장만 공지를 작성할 수 있습니다.");
        Notice notice = new Notice();
        notice.setClubId(clubId);
        notice.setAuthorId(authorId);
        notice.setTitle(title);
        notice.setContent(content);
        return noticeRepository.save(notice);
    }

    @Transactional
    public void delete(Long noticeId, Long requestUserId) {
        Notice notice = noticeRepository.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("공지를 찾을 수 없습니다."));
        boolean isCreator = clubRepository.findById(notice.getClubId())
            .map(c -> c.getCreatorId().equals(requestUserId))
            .orElse(false);
        boolean isAdmin = userRepository.findById(requestUserId)
            .map(u -> "ADMIN".equals(u.getRole()))
            .orElse(false);
        if (!isCreator && !isAdmin) throw new SecurityException("권한이 없습니다.");
        noticeRepository.delete(notice);
    }
}
