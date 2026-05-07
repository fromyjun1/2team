package com.club.part4.repository;

import com.club.part4.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByUserIdAndClubId(Long userId, Long clubId);
    List<Application> findByUserIdOrderByAppliedAtDesc(Long userId);
    List<Application> findByClubIdOrderByAppliedAt(Long clubId);
}
