package com.club.part4.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "APPLICATIONS")
@Getter @Setter
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_app")
    @SequenceGenerator(name = "seq_app", sequenceName = "SEQ_APP_ID", allocationSize = 1)
    @Column(name = "APP_ID")
    private Long appId;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "CLUB_ID", nullable = false)
    private Long clubId;

    @Column(name = "MOTIVATION", length = 1000, nullable = false)
    private String motivation;

    @Column(name = "STATUS")
    private String status = "PENDING";

    @Column(name = "APPLIED_AT")
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "REVIEWED_AT")
    private LocalDateTime reviewedAt;

    @Column(name = "REVIEW_COMMENT")
    private String reviewComment;
}
