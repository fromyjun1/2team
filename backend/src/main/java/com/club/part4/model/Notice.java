package com.club.part4.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "NOTICES")
@Getter @Setter
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_notice")
    @SequenceGenerator(name = "seq_notice", sequenceName = "seq_notice_id", allocationSize = 1)
    @Column(name = "NOTICE_ID")
    private Long noticeId;

    @Column(name = "CLUB_ID", nullable = false)
    private Long clubId;

    @Column(name = "AUTHOR_ID", nullable = false)
    private Long authorId;

    @Column(name = "TITLE", length = 200, nullable = false)
    private String title;

    @Column(name = "CONTENT", length = 2000, nullable = false)
    private String content;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private String authorName;
}
