package com.syncplay.server;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*") // 리액트 연동을 위한 CORS 허용 추가
@RequestMapping("/api/users/subscriptions")
public class UserSubscriptionController {

    private final UserSubscriptionService userSubscriptionService;

    public UserSubscriptionController(UserSubscriptionService userSubscriptionService) {
        this.userSubscriptionService = userSubscriptionService;
    }

    @GetMapping
    public SubscriptionResponse getSubscriptions(@RequestParam String email) {
        return new SubscriptionResponse(userSubscriptionService.getSubscriptions(email));
    }

    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    public SubscriptionResponse updateSubscriptions(
            @RequestParam String email,
            @RequestBody SubscriptionUpdateRequest request
    ) {
        List<String> subscriptions = request.subscriptions() == null ? List.of() : request.subscriptions();
        userSubscriptionService.updateSubscriptions(email, subscriptions);
        return new SubscriptionResponse(userSubscriptionService.getSubscriptions(email));
    }

    public record SubscriptionUpdateRequest(List<String> subscriptions) {}
    public record SubscriptionResponse(List<String> subscriptions) {}
}