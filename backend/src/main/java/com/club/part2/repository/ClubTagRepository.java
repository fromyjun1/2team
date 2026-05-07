package com.club.part2.repository;

import com.club.part2.model.ClubTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClubTagRepository extends JpaRepository<ClubTag, Long> {
    List<ClubTag> findByClubClubId(Long clubId);
    void deleteByClubClubId(Long clubId);
}
