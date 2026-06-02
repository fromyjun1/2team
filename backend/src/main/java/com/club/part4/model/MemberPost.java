package com.club.part4.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "MEMBER_POSTS")
@Getter @Setter
public class MemberPost {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_member_post")
    @SequenceGenerator(name = "seq_member_post", sequenceName = "seq_member_post_id", allocationSize = 1)
    @Column(name = "POST_ID")
    private Long postId;

    @Column(name = "CLUB_ID", nullable = false)
    private Long clubId;

    @Column(name = "AUTHOR_ID", nullable = false)
    private Long authorId;

    @Column(name = "PARENT_ID")
    private Long parentId;

    @Column(name = "TITLE", length = 200)
    private String title;

    @Column(name = "CONTENT", length = 2000, nullable = false)
    private String content;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private List<MemberPost> replies;

    @Transient
    private String authorName;
}
