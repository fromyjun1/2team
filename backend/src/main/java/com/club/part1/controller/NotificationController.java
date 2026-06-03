package com.club.part1.controller;

import com.club.part1.model.Notification;
import com.club.part1.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // GET /api/notifications — 내 알림 목록 (최신순 20개)
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getNotifications(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<Map<String, Object>> result = notificationService.getByUser(userId).stream()
            .limit(20)
            .map(n -> Map.<String, Object>of(
                "id",        n.getNotificationId(),
                "type",      n.getType(),
                "message",   n.getMessage(),
                "link",      n.getLink() != null ? n.getLink() : "",
                "isRead",    n.isRead(),
                "createdAt", n.getCreatedAt()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // GET /api/notifications/unread-count — 읽지 않은 알림 수
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    // PATCH /api/notifications/{id}/read — 알림 1개 읽음 처리
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ResponseEntity.ok().build();
    }

    // PATCH /api/notifications/read-all — 전체 읽음 처리
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        notificationService.markAllRead(userId);
        return ResponseEntity.ok().build();
    }
}
