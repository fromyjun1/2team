package com.club.part1.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.club.config.JwtUtil;
import com.club.part1.model.User;
import com.club.part1.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // GET /api/users/check-email?email=xxx — 이메일 중복 여부 확인 (공개)
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("available", userService.isEmailAvailable(email)));
    }

    // GET /api/users/find-email?name=xxx&studentNo=xxx — 아이디(이메일) 찾기 (공개)
    @GetMapping("/find-email")
    public ResponseEntity<Map<String, String>> findEmail(@RequestParam String name,
                                                         @RequestParam String studentNo) {
        return ResponseEntity.ok(Map.of("email", userService.findEmail(name, studentNo)));
    }

    // PUT /api/users/change-password — 비밀번호 변경 (공개)
    @PutMapping("/change-password")
    public ResponseEntity<Void> changePassword(@RequestBody Map<String, String> body) {
        userService.changePassword(body.get("email"), body.get("newPassword"));
        return ResponseEntity.ok().build();
    }

    // GET /api/users/me — 현재 토큰의 유저 정보 반환 (새로고침 후 로그인 유지용)
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMe(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getMe(userId));
    }

    // POST /api/users/signup — 가입 즉시 토큰 발급해서 자동 로그인
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> body) {
        User user = userService.signup(
            body.get("email"),
            body.get("password"),
            body.get("name")
        );
        String token = jwtUtil.generateToken(user.getUserId(), user.getRole());
        Map<String, Object> result = new HashMap<>();
        result.put("userId",     user.getUserId());
        result.put("name",       user.getUserName());
        result.put("email",      user.getUserEmail());
        result.put("role",       user.getRole());
        result.put("token",      token);
        result.put("studentNo",  null);
        result.put("department", null);
        return ResponseEntity.ok(result);
    }

    // GET /api/users/{userId}/profile — 학생 정보 조회
    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable Long userId,
                                                          Authentication authentication) {
        if (!userId.equals((Long) authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    // PUT /api/users/{userId}/profile — 학생 정보 + 재학인증서 저장
    @PutMapping("/{userId}/profile")
    public ResponseEntity<Void> updateProfile(
            @PathVariable Long userId,
            @RequestParam(required = false) String studentNo,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) MultipartFile certificate,
            Authentication authentication) throws IOException {
        if (!userId.equals((Long) authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        String certPath = null;
        if (certificate != null && !certificate.isEmpty()) {
            String filename = UUID.randomUUID() + "_" + certificate.getOriginalFilename();
            Path dir = Paths.get(uploadDir, "certificates");
            Files.createDirectories(dir);
            Files.copy(certificate.getInputStream(), dir.resolve(filename));
            certPath = filename;
        }
        userService.updateProfile(userId, studentNo, department, certPath);
        return ResponseEntity.ok().build();
    }

    // POST /api/users/login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.login(body.get("email"), body.get("password")));
    }

    // PATCH /api/users/{userId}/password — 로그인 상태에서 현재 PW 확인 후 변경
    @PatchMapping("/{userId}/password")
    public ResponseEntity<Void> changePasswordLoggedIn(@PathVariable Long userId,
                                                       @RequestBody Map<String, String> body,
                                                       Authentication authentication) {
        if (!userId.equals((Long) authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        userService.changePasswordLoggedIn(userId, body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok().build();
    }

    // GET /api/users/{userId}/tags — 본인 태그만 조회 가능
    @GetMapping("/{userId}/tags")
    public ResponseEntity<List<String>> getTags(@PathVariable Long userId,
                                                Authentication authentication) {
        if (!userId.equals((Long) authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.getUserTags(userId));
    }

    // PUT /api/users/{userId}/tags — 본인 태그만 수정 가능
    @PutMapping("/{userId}/tags")
    public ResponseEntity<Void> updateTags(@PathVariable Long userId,
                                           @RequestBody List<String> tags,
                                           Authentication authentication) {
        if (!userId.equals((Long) authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        userService.updateTags(userId, tags);
        return ResponseEntity.ok().build();
    }
}
