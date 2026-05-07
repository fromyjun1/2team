package com.club.part4.service;

import com.club.part4.model.Application;
import com.club.part4.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    @Transactional
    public Application apply(Long userId, Long clubId, String motivation) {
        if (applicationRepository.existsByUserIdAndClubId(userId, clubId)) {
            throw new IllegalStateException("이미 신청한 동아리입니다.");
        }
        Application app = new Application();
        app.setUserId(userId);
        app.setClubId(clubId);
        app.setMotivation(motivation);
        return applicationRepository.save(app);
    }

    public List<Application> getByUser(Long userId) {
        return applicationRepository.findByUserIdOrderByAppliedAtDesc(userId);
    }

    public List<Application> getByClub(Long clubId) {
        return applicationRepository.findByClubIdOrderByAppliedAt(clubId);
    }

    @Transactional
    public void updateStatus(Long appId, String status, String comment) {
        Application app = applicationRepository.findById(appId)
            .orElseThrow(() -> new IllegalArgumentException("신청 정보를 찾을 수 없습니다."));
        app.setStatus(status);
        app.setReviewComment(comment);
        app.setReviewedAt(LocalDateTime.now());
    }
}
