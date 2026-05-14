package com.club.part1.controller;

import com.club.config.JwtUtil;
import com.club.part1.model.User;
import com.club.part1.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    // GET /api/users/check-email?email=xxx — 이메일 중복 여부 확인 (공개)
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("available", userService.isEmailAvailable(email)));
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
            body.get("name"),
            body.get("studentNo"),
            body.get("department")
        );
        String token = jwtUtil.generateToken(user.getUserId(), user.getRole());
        return ResponseEntity.ok(Map.of(
            "userId", user.getUserId(),
            "name",   user.getUserName(),
            "email",  user.getUserEmail(),
            "role",   user.getRole(),
            "token",  token
        ));
    }

    // POST /api/users/login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.login(body.get("email"), body.get("password")));
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
