package com.club.part1.repository;

import com.club.part1.model.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {
    List<UserInterest> findByUserUserId(Long userId);
    void deleteByUserUserId(Long userId);
}
