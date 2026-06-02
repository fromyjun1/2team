package com.club.part2.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "CLUBS")
@Getter @Setter
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_club")
    @SequenceGenerator(name = "seq_club", sequenceName = "seq_club_id", allocationSize = 1)
    @Column(name = "CLUB_ID")
    private Long clubId;

    @Column(name = "CLUB_NAME", nullable = false, unique = true)
    private String clubName;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Column(name = "IMAGE_PATH")
    private String imagePath;

    @Column(name = "CATEGORY")
    private String category;

    @Column(name = "MAX_MEMBERS")
    private Integer maxMembers = 30;

    @Column(name = "CONTACT_EMAIL")
    private String contactEmail;

    @Column(name = "IS_ACTIVE")
    private String isActive = "Y";

    @Column(name = "IS_RECRUITING")
    private String isRecruiting = "Y";

    @Column(name = "CREATOR_ID")
    private Long creatorId;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    // EAGER: 동아리 상세 조회 시 태그도 함께 직렬화 (ClubDetailPage에서 사용)
    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ClubTag> tags;
}
