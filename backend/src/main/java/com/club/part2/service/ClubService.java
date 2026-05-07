package com.club.part2.service;

import com.club.part2.model.Club;
import com.club.part2.model.ClubTag;
import com.club.part2.repository.ClubRepository;
import com.club.part2.repository.ClubTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final ClubTagRepository clubTagRepository;

    public List<Club> getClubs(String category) {
        if (category != null && !category.isBlank()) {
            return clubRepository.findByCategoryAndIsActive(category, "Y");
        }
        return clubRepository.findByIsActive("Y");
    }

    public Club getClub(Long clubId) {
        return clubRepository.findById(clubId)
            .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다."));
    }

    @Transactional
    public Club createClub(Map<String, Object> body) {
        Club club = new Club();
        club.setClubName((String) body.get("clubName"));
        club.setDescription((String) body.get("description"));
        club.setImagePath((String) body.get("imagePath"));
        club.setCategory((String) body.get("category"));
        club.setContactEmail((String) body.get("contactEmail"));
        if (body.containsKey("maxMembers")) {
            club.setMaxMembers((Integer) body.get("maxMembers"));
        }
        Club saved = clubRepository.save(club);

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) body.get("tags");
        if (tags != null) {
            tags.forEach(tag -> {
                ClubTag ct = new ClubTag();
                ct.setClub(saved);
                ct.setTagName(tag);
                clubTagRepository.save(ct);
            });
        }
        return saved;
    }

    @Transactional
    public void updateTags(Long clubId, List<String> tags) {
        clubTagRepository.deleteByClubClubId(clubId);
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다."));
        tags.forEach(tag -> {
            ClubTag ct = new ClubTag();
            ct.setClub(club);
            ct.setTagName(tag);
            clubTagRepository.save(ct);
        });
    }
}
