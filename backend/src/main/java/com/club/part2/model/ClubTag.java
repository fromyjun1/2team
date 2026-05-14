package com.club.part2.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CLUB_TAGS")
@Getter @Setter
public class ClubTag {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_club_tag")
    @SequenceGenerator(name = "seq_club_tag", sequenceName = "seq_club_tag_id", allocationSize = 1)
    @Column(name = "TAG_ID")
    private Long tagId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CLUB_ID", nullable = false)
    private Club club;

    @Column(name = "TAG_NAME", nullable = false)
    private String tagName;
}
