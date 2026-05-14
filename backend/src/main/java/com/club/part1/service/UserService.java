package com.club.part1.service;

import com.club.config.JwtUtil;
import com.club.part1.model.User;
import com.club.part1.model.UserInterest;
import com.club.part1.repository.UserRepository;
import com.club.part1.repository.UserInterestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Pattern PW_PATTERN =
        Pattern.compile("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$");

    private final UserRepository userRepository;
    private final UserInterestRepository interestRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public User signup(String email, String rawPassword, String name, String studentNo, String department) {
        if (!PW_PATTERN.matcher(rawPassword).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 8자 이상이어야 합니다.");
        }
        if (userRepository.existsByUserEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }
        User user = new User();
        user.setUserEmail(email);
        user.setUserPw(passwordEncoder.encode(rawPassword));
        user.setUserName(name);
        user.setStudentNo(studentNo);
        user.setDepartment(department);
        return userRepository.save(user);
    }

    public Map<String, Object> login(String email, String rawPassword) {
        User user = userRepository.findByUserEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));
        if (!passwordEncoder.matches(rawPassword, user.getUserPw())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }
        String token = jwtUtil.generateToken(user.getUserId(), user.getRole());
        return Map.of(
            "userId", user.getUserId(),
            "name",   user.getUserName(),
            "role",   user.getRole(),
            "token",  token
        );
    }

    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByUserEmail(email);
    }

    public Map<String, Object> getMe(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return Map.of(
            "userId", user.getUserId(),
            "name",   user.getUserName(),
            "email",  user.getUserEmail(),
            "role",   user.getRole()
        );
    }

    public List<String> getUserTags(Long userId) {
        return interestRepository.findByUserUserId(userId)
            .stream()
            .map(UserInterest::getTagName)
            .collect(Collectors.toList());
    }

    @Transactional
    public void updateTags(Long userId, List<String> tags) {
        interestRepository.deleteByUserUserId(userId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        tags.forEach(tag -> {
            UserInterest interest = new UserInterest();
            interest.setUser(user);
            interest.setTagName(tag);
            interestRepository.save(interest);
        });
    }
}
