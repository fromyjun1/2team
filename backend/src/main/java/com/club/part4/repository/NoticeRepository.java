package com.club.part4.repository;

import com.club.part4.model.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findByClubIdOrderByCreatedAtDesc(Long clubId);
}
