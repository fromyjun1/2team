package com.club.part1.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailVerificationService {

    private static final int EXPIRE_MINUTES = 5;

    private record Entry(String code, LocalDateTime expiry) {}

    private final Map<String, Entry> store = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateAndStore(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        store.put(email, new Entry(code, LocalDateTime.now().plusMinutes(EXPIRE_MINUTES)));
        return code;
    }

    public boolean verify(String email, String code) {
        Entry entry = store.get(email);
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            store.remove(email);
            return false;
        }
        if (!entry.code().equals(code)) return false;
        store.remove(email);
        return true;
    }
}
