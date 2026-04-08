package com.syncplay.server;

import java.util.List;

public record ProviderAvailabilityResponse(
        String title,
        String region,
        List<String> userSubscriptions,
        List<ProviderStatus> providers,
        List<String> debugLog
) {
    public record ProviderStatus(
            Integer providerId,
            String providerName,
            String logoPath,
            String status
    ) {}
}
