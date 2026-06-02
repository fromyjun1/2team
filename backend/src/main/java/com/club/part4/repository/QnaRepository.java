package com.club.part4.repository;

import com.club.part4.model.QnaBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface QnaRepository extends JpaRepository<QnaBoard, Long> {
    List<QnaBoard> findByClubIdOrderByCreatedAt(Long clubId);
    List<QnaBoard> findByParentId(Long parentId);
}
