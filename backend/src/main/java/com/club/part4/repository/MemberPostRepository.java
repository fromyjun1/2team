package com.club.part4.repository;

import com.club.part4.model.MemberPost;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MemberPostRepository extends JpaRepository<MemberPost, Long> {
    List<MemberPost> findByClubIdOrderByCreatedAtDesc(Long clubId);
    List<MemberPost> findByParentId(Long parentId);
}
