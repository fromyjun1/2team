package com.club.part2.controller;

import com.club.part2.model.Club;
import com.club.part2.service.ClubService;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    @Value("${app.gcs.bucket}")
    private String gcsBucket;

    // GET /api/clubs — 전체 목록
    @GetMapping
    public ResponseEntity<List<Club>> getAllClubs(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(clubService.getClubs(category));
    }

    // GET /api/clubs/{clubId} — 상세 정보
    @GetMapping("/{clubId}")
    public ResponseEntity<Club> getClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(clubService.getClub(clubId));
    }

    // POST /api/clubs — 동아리 등록 (로그인 유저 누구나, 생성자가 클럽 관리자)
    @PostMapping
    public ResponseEntity<Club> createClub(@RequestBody Map<String, Object> body,
                                           Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(clubService.createClub(body, userId));
    }

    // PUT /api/clubs/{clubId} — 동아리 정보 수정 (클럽 관리자만)
    @PutMapping("/{clubId}")
    public ResponseEntity<Club> updateClub(@PathVariable Long clubId,
                                           @RequestBody Map<String, Object> body,
                                           Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(clubService.updateClub(clubId, body, userId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    // POST /api/clubs/image — 이미지 업로드 (로그인 유저 누구나)
    @PostMapping("/image")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Thumbnails.of(file.getInputStream())
                .crop(Positions.CENTER)
                .size(800, 500)
                .outputFormat("jpg")
                .toOutputStream(baos);

        String filename = "clubs/" + UUID.randomUUID() + ".jpg";
        Storage storage = StorageOptions.getDefaultInstance().getService();
        BlobInfo blobInfo = BlobInfo.newBuilder(gcsBucket, filename)
                .setContentType("image/jpeg")
                .build();
        storage.create(blobInfo, baos.toByteArray());
        String publicUrl = "https://storage.googleapis.com/" + gcsBucket + "/" + filename;
        return ResponseEntity.ok(Map.of("imagePath", publicUrl));
    }

    // PUT /api/clubs/{clubId}/tags — 태그 수정 (클럽 관리자만)
    @PutMapping("/{clubId}/tags")
    public ResponseEntity<Void> updateTags(@PathVariable Long clubId,
                                           @RequestBody List<String> tags,
                                           Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        if (!clubService.isClubAdmin(clubId, userId)) {
            // 글로벌 ADMIN도 허용
            boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        clubService.updateTags(clubId, tags);
        return ResponseEntity.ok().build();
    }
}
