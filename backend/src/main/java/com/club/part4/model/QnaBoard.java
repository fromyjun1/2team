package com.club.part4.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "QNA_BOARD")
@Getter @Setter
public class QnaBoard {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_qna")
    @SequenceGenerator(name = "seq_qna", sequenceName = "seq_qna_id", allocationSize = 1)
    @Column(name = "QNA_ID")
    private Long qnaId;

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

    @Column(name = "IS_SECRET")
    private String isSecret = "N";

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Transient
    private List<QnaBoard> replies;

    @Transient
    private String authorName;
}
