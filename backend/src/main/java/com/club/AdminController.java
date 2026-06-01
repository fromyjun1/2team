package com.club;

import com.club.part2.model.Club;
import com.club.part2.service.ClubService;
import com.club.part4.repository.ApplicationRepository;
import com.club.part4.service.ApplicationService;
import com.club.part1.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final ClubService clubService;
    private final ApplicationService applicationService;
    private final ApplicationRepository applicationRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
            "users",        userService.countUsers(),
            "clubs",        clubService.countActiveClubs(),
            "applications", applicationRepository.count(),
            "pending",      applicationRepository.countByStatus("PENDING")
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<Void> changeRole(@PathVariable Long userId,
                                           @RequestBody Map<String, String> body) {
        userService.changeRole(userId, body.get("role"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/clubs")
    public ResponseEntity<List<Club>> getAllClubs() {
        return ResponseEntity.ok(clubService.getAllClubs());
    }

    @DeleteMapping("/clubs/{clubId}")
    public ResponseEntity<Void> deactivateClub(@PathVariable Long clubId) {
        clubService.deactivateClub(clubId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/applications")
    public ResponseEntity<List<Map<String, Object>>> getAllApplications() {
        return ResponseEntity.ok(applicationService.getAllApplications());
    }
}
