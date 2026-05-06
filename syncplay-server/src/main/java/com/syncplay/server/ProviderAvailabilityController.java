package com.syncplay.server;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*") // 리액트 연동을 위한 CORS 허용 추가
@RequestMapping("/api/providers")
public class ProviderAvailabilityController {

    private final ProviderAvailabilityService providerAvailabilityService;

    public ProviderAvailabilityController(ProviderAvailabilityService providerAvailabilityService) {
        this.providerAvailabilityService = providerAvailabilityService;
    }

    @GetMapping("/availability")
    public ProviderAvailabilityResponse getAvailability(
            @RequestParam String title,
            @RequestParam String email,
            @RequestParam(defaultValue = "KR") String region
    ) {
        return providerAvailabilityService.getAvailabilityByTitle(title, email, region);
    }
}