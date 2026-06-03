package com.club.part2.repository;

import com.club.part2.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findByIsActive(String isActive);
    List<Club> findByCategoryAndIsActive(String category, String isActive);
    List<Club> findByCreatorIdAndIsActive(Long creatorId, String isActive);
    boolean existsByClubName(String clubName);
    boolean existsByClubNameAndClubIdNot(String clubName, Long clubId);
}
