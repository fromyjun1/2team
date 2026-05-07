package com.club.part1.controller;

import com.club.part1.model.User;
import com.club.part1.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // POST /api/users/signup — login과 동일한 Map 형식으로 반환
    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> body) {
        User user = userService.signup(
            body.get("email"),
            body.get("password"),
            body.get("name"),
            body.get("studentNo"),
            body.get("department")
        );
        return ResponseEntity.ok(Map.of(
            "userId", user.getUserId(),
            "name",   user.getUserName(),
            "email",  user.getUserEmail(),
            "role",   user.getRole()
        ));
    }

    // POST /api/users/login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.login(body.get("email"), body.get("password")));
    }

    // GET /api/users/{userId}/tags
    @GetMapping("/{userId}/tags")
    public ResponseEntity<List<String>> getTags(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserTags(userId));
    }

    // PUT /api/users/{userId}/tags
    @PutMapping("/{userId}/tags")
    public ResponseEntity<Void> updateTags(@PathVariable Long userId,
                                           @RequestBody List<String> tags) {
        userService.updateTags(userId, tags);
        return ResponseEntity.ok().build();
    }
}
