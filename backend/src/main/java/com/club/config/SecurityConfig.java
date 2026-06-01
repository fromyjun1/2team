package com.club.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // 오류 페이지 — 누구나 접근 가능
                .requestMatchers("/error").permitAll()
                // 회원가입, 로그인, 이메일 중복 확인 — 누구나 접근 가능
                .requestMatchers(HttpMethod.GET,  "/api/users/check-email", "/api/users/find-email").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/users/signup", "/api/users/login").permitAll()
                .requestMatchers(HttpMethod.PUT,  "/api/users/change-password").permitAll()
                // 업로드된 이미지 — 누구나 접근 가능
                .requestMatchers("/images/**").permitAll()
                // 동아리 목록/상세 — 누구나 접근 가능
                .requestMatchers(HttpMethod.GET, "/api/clubs", "/api/clubs/**").permitAll()
                // 관리자 전용 API
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // 나머지 — 로그인 필요
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
