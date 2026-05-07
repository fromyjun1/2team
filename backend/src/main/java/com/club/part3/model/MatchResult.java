package com.club.part3.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

// 매칭 결과 응답 DTO (DB 엔티티 아님)
@Getter
@AllArgsConstructor
public class MatchResult {
    private Long clubId;
    private String clubName;
    private String description;
    private String imagePath;
    private String category;
    private int matchCount;
    private int totalTags;
    private double scorePct;
    private boolean wishlisted;
}
