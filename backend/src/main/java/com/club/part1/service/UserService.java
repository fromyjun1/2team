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

import java.util.HashMap;
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
    public User signup(String email, String rawPassword, String name) {
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
        return userRepository.save(user);
    }

    public Map<String, Object> login(String email, String rawPassword) {
        User user = userRepository.findByUserEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));
        if (!passwordEncoder.matches(rawPassword, user.getUserPw())) {
            throw new IllegalArgumentException("비밀번호가 올바르지 않습니다.");
        }
        String token = jwtUtil.generateToken(user.getUserId(), user.getRole());
        Map<String, Object> result = new HashMap<>();
        result.put("userId",     user.getUserId());
        result.put("name",       user.getUserName());
        result.put("email",      user.getUserEmail());
        result.put("role",       user.getRole());
        result.put("token",      token);
        result.put("studentNo",  user.getStudentNo());
        result.put("department", user.getDepartment());
        return result;
    }

    public boolean isEmailAvailable(String email) {
        return !userRepository.existsByUserEmail(email);
    }

    public Map<String, Object> getMe(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Map<String, Object> result = new HashMap<>();
        result.put("userId",     user.getUserId());
        result.put("name",       user.getUserName());
        result.put("email",      user.getUserEmail());
        result.put("role",       user.getRole());
        result.put("studentNo",  user.getStudentNo());
        result.put("department", user.getDepartment());
        return result;
    }

    public Map<String, Object> getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Map<String, Object> result = new HashMap<>();
        result.put("studentNo",       user.getStudentNo());
        result.put("department",      user.getDepartment());
        result.put("certificatePath", user.getCertificatePath());
        return result;
    }

    public String findEmail(String name, String studentNo) {
        User user = userRepository.findByUserNameAndStudentNo(name, studentNo)
            .orElseThrow(() -> new IllegalArgumentException("일치하는 회원 정보를 찾을 수 없습니다."));
        return maskEmail(user.getUserEmail());
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return email;
        String local  = email.substring(0, at);
        String domain = email.substring(at);
        if (local.length() <= 2) return local.charAt(0) + "***" + domain;
        return local.charAt(0) + "*".repeat(local.length() - 2) + local.charAt(local.length() - 1) + domain;
    }

    @Transactional
    public void changePasswordLoggedIn(Long userId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        if (!PW_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 8자 이상이어야 합니다.");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!passwordEncoder.matches(currentPassword, user.getUserPw())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }
        user.setUserPw(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void changePassword(String email, String newPassword) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("새 비밀번호를 입력해주세요.");
        }
        if (!PW_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 8자 이상이어야 합니다.");
        }
        User user = userRepository.findByUserEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));
        user.setUserPw(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void updateProfile(Long userId, String studentNo, String department, String certificatePath) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (studentNo    != null) user.setStudentNo(studentNo);
        if (department   != null) user.setDepartment(department);
        if (certificatePath != null) user.setCertificatePath(certificatePath);
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
        interestRepository.flush(); // DELETE를 즉시 DB에 반영 후 INSERT (unique 제약 위반 방지)
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
