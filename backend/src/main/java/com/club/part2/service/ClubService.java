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

    public boolean isClubAdmin(Long clubId, Long userId) {
        return clubRepository.findById(clubId)
            .map(c -> userId.equals(c.getCreatorId()))
            .orElse(false);
    }

    @Transactional
    public Club createClub(Map<String, Object> body, Long creatorId) {
        String clubName = (String) body.get("clubName");
        if (clubRepository.existsByClubName(clubName)) {
            throw new IllegalArgumentException("이미 사용 중인 동아리 이름입니다.");
        }
        Club club = new Club();
        club.setClubName(clubName);
        club.setDescription((String) body.get("description"));
        club.setImagePath((String) body.get("imagePath"));
        club.setCategory((String) body.get("category"));
        club.setContactEmail((String) body.get("contactEmail"));
        club.setCreatorId(creatorId);
        if (body.containsKey("maxMembers") && body.get("maxMembers") != null) {
            club.setMaxMembers(((Number) body.get("maxMembers")).intValue());
        }
        Club saved = clubRepository.save(club);

        @SuppressWarnings("unchecked")
        List<String> tags = (List<String>) body.get("tags");
        if (tags != null) {
            tags.forEach(tag -> {
                ClubTag ct = new ClubTag();
                ct.setClub(saved);
                ct.setTagName(tag.startsWith("#") ? tag : "#" + tag);
                clubTagRepository.save(ct);
            });
        }
        return saved;
    }

    @Transactional
    public Club updateClub(Long clubId, Map<String, Object> body, Long requesterId) {
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다."));
        if (!requesterId.equals(club.getCreatorId())) {
            throw new IllegalStateException("동아리 관리자만 수정할 수 있습니다.");
        }
        if (body.containsKey("clubName")) {
            String newName = (String) body.get("clubName");
            if (!newName.equals(club.getClubName()) && clubRepository.existsByClubNameAndClubIdNot(newName, clubId)) {
                throw new IllegalArgumentException("이미 사용 중인 동아리 이름입니다.");
            }
            club.setClubName(newName);
        }
        if (body.containsKey("description")) club.setDescription((String) body.get("description"));
        if (body.containsKey("imagePath"))   club.setImagePath((String) body.get("imagePath"));
        if (body.containsKey("category"))    club.setCategory((String) body.get("category"));
        if (body.containsKey("contactEmail")) club.setContactEmail((String) body.get("contactEmail"));
        if (body.containsKey("maxMembers") && body.get("maxMembers") != null) {
            club.setMaxMembers(((Number) body.get("maxMembers")).intValue());
        }
        if (body.containsKey("isRecruiting")) club.setIsRecruiting((String) body.get("isRecruiting"));
        return clubRepository.save(club);
    }

    public List<Club> getAllClubs() {
        return clubRepository.findAll();
    }

    public long countActiveClubs() {
        return clubRepository.findByIsActive("Y").size();
    }

    @Transactional
    public void deactivateClub(Long clubId) {
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다."));
        club.setIsActive("N");
    }

    @Transactional
    public void deleteClub(Long clubId) {
        if (!clubRepository.existsById(clubId)) {
            throw new IllegalArgumentException("동아리를 찾을 수 없습니다.");
        }
        clubRepository.deleteById(clubId);
    }

    @Transactional
    public void updateTags(Long clubId, List<String> tags) {
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new IllegalArgumentException("동아리를 찾을 수 없습니다."));
        club.getTags().clear();
        clubRepository.saveAndFlush(club);
        tags.forEach(tag -> {
            ClubTag ct = new ClubTag();
            ct.setClub(club);
            ct.setTagName(tag.startsWith("#") ? tag : "#" + tag);
            club.getTags().add(ct);
        });
    }
}
