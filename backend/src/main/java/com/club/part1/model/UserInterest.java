package com.club.part1.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "USER_INTERESTS")
@Getter @Setter
public class UserInterest {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_interest")
    @SequenceGenerator(name = "seq_interest", sequenceName = "seq_interest_id", allocationSize = 1)
    @Column(name = "INTEREST_ID")
    private Long interestId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    @Column(name = "TAG_NAME", nullable = false)
    private String tagName;
}
