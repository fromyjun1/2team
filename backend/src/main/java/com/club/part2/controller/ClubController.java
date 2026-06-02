package com.club.part2.controller;

import com.club.part2.model.Club;
import com.club.part2.service.ClubService;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.geometry.Positions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private static final Logger log = LoggerFactory.getLogger(ClubController.class);
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
    public ResponseEntity<?> createClub(@RequestBody Map<String, Object> body,
                                        Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(clubService.createClub(body, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/clubs/{clubId} — 동아리 정보 수정 (클럽 관리자만)
    @PutMapping("/{clubId}")
    public ResponseEntity<?> updateClub(@PathVariable Long clubId,
                                        @RequestBody Map<String, Object> body,
                                        Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        try {
            return ResponseEntity.ok(clubService.updateClub(clubId, body, userId));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/clubs/image — 이미지 업로드 (로그인 유저 누구나)
    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "파일이 비어 있습니다."));
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "이미지 파일만 업로드 가능합니다."));
        }
        if (file.getSize() > 10L * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "파일 크기는 10MB 이하여야 합니다."));
        }
        try {
            BufferedImage sourceImage = ImageIO.read(file.getInputStream());
            if (sourceImage == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "지원하지 않는 이미지 형식입니다. JPG, PNG, WebP 파일을 사용해주세요."));
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Thumbnails.of(sourceImage)
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
        } catch (Exception e) {
            log.error("이미지 업로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "이미지 업로드 실패: " + e.getMessage()));
        }
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
