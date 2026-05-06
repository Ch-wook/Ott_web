package com.syncplay.server;

import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/wishlist")
public class WishlistController {
    // 사용자 이메일별로 찜한 목록을 메모리에 저장합니다.
    private final Map<String, List<Map<String, Object>>> wishlistMap = new ConcurrentHashMap<>();

    @GetMapping
    public List<Map<String, Object>> getWishlist(@RequestParam String email) {
        return wishlistMap.getOrDefault(email.toLowerCase(), new ArrayList<>());
    }

    @PostMapping
    public List<Map<String, Object>> toggleWishlist(@RequestParam String email, @RequestBody Map<String, Object> item) {
        String key = email.toLowerCase();
        List<Map<String, Object>> userList = wishlistMap.computeIfAbsent(key, k -> new ArrayList<>());
        
        // 이미 찜했는지 확인 (ID 기준)
        boolean removed = userList.removeIf(existing -> existing.get("id").equals(item.get("id")));
        
        if (!removed) {
            userList.add(0, item); // 방금 찜한 게 맨 앞으로 오게 추가
        }
        
        return userList;
    }
}