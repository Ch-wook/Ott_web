package com.syncplay.server;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class UserSubscriptionService {

    private final Map<String, Set<String>> subscriptionsByUser = new ConcurrentHashMap<>();

    public List<String> getSubscriptions(String email) {
        return subscriptionsByUser
                .getOrDefault(normalizeEmail(email), Set.of())
                .stream()
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    public void updateSubscriptions(String email, List<String> subscriptions) {
        String normalizedEmail = normalizeEmail(email);
        Set<String> normalizedSubscriptions = subscriptions.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.toSet());

        subscriptionsByUser.put(normalizedEmail, normalizedSubscriptions);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase();
    }
}
