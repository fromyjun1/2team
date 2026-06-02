package com.club.part4.service;

import com.club.part1.repository.UserRepository;
import com.club.part2.repository.ClubRepository;
import com.club.part4.model.Application;
import com.club.part4.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;

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

    public Application getById(Long appId) {
        return applicationRepository.findById(appId)
            .orElseThrow(() -> new IllegalArgumentException("신청 정보를 찾을 수 없습니다."));
    }

    public List<Map<String, Object>> getByUser(Long userId) {
        return applicationRepository.findByUserIdOrderByAppliedAtDesc(userId)
            .stream()
            .map(app -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("appId",         app.getAppId());
                dto.put("clubId",        app.getClubId());
                dto.put("clubName",      clubRepository.findById(app.getClubId())
                                            .map(c -> c.getClubName())
                                            .orElse("알 수 없는 동아리"));
                dto.put("motivation",    app.getMotivation());
                dto.put("status",        app.getStatus());
                dto.put("appliedAt",     app.getAppliedAt());
                dto.put("reviewComment", app.getReviewComment());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getByClub(Long clubId) {
        return applicationRepository.findByClubIdOrderByAppliedAt(clubId)
            .stream()
            .map(app -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("appId",         app.getAppId());
                dto.put("userId",        app.getUserId());
                dto.put("userName",      userRepository.findById(app.getUserId())
                                            .map(u -> u.getUserName())
                                            .orElse("알 수 없음"));
                dto.put("motivation",    app.getMotivation());
                dto.put("status",        app.getStatus());
                dto.put("appliedAt",     app.getAppliedAt());
                dto.put("reviewComment", app.getReviewComment());
                return dto;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllApplications() {
        return applicationRepository.findAll().stream()
            .sorted((a, b) -> b.getAppliedAt().compareTo(a.getAppliedAt()))
            .map(app -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("appId",         app.getAppId());
                dto.put("clubId",        app.getClubId());
                dto.put("clubName",      clubRepository.findById(app.getClubId())
                                            .map(c -> c.getClubName()).orElse("알 수 없는 동아리"));
                dto.put("userId",        app.getUserId());
                dto.put("userName",      userRepository.findById(app.getUserId())
                                            .map(u -> u.getUserName()).orElse("알 수 없음"));
                dto.put("motivation",    app.getMotivation());
                dto.put("status",        app.getStatus());
                dto.put("appliedAt",     app.getAppliedAt());
                dto.put("reviewComment", app.getReviewComment());
                return dto;
            }).collect(Collectors.toList());
    }

    @Transactional
    public void updateStatus(Long appId, String status, String comment) {
        Application app = applicationRepository.findById(appId)
            .orElseThrow(() -> new IllegalArgumentException("신청 정보를 찾을 수 없습니다."));
        app.setStatus(status);
        app.setReviewComment(comment);
        app.setReviewedAt(LocalDateTime.now());
        applicationRepository.save(app);
    }

    public long getMemberCount(Long clubId) {
        return applicationRepository.countByClubIdAndStatus(clubId, "APPROVED");
    }

    @Transactional
    public void leaveClub(Long userId, Long clubId) {
        Application app = applicationRepository.findByUserIdAndClubId(userId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("가입 정보를 찾을 수 없습니다."));
        if (!"APPROVED".equals(app.getStatus())) {
            throw new IllegalStateException("승인된 멤버만 탈퇴할 수 있습니다.");
        }
        app.setStatus("QUIT");
        app.setReviewedAt(LocalDateTime.now());
        applicationRepository.save(app);
    }

    @Transactional
    public Application reapply(Long userId, Long clubId, String motivation) {
        Application app = applicationRepository.findByUserIdAndClubId(userId, clubId)
            .orElseThrow(() -> new IllegalArgumentException("기존 신청 정보를 찾을 수 없습니다."));
        if (!"REJECTED".equals(app.getStatus()) && !"QUIT".equals(app.getStatus())) {
            throw new IllegalStateException("거절되거나 탈퇴한 경우에만 재신청할 수 있습니다.");
        }
        app.setStatus("PENDING");
        app.setMotivation(motivation);
        app.setReviewComment(null);
        app.setAppliedAt(LocalDateTime.now());
        app.setReviewedAt(null);
        return applicationRepository.save(app);
    }
}
