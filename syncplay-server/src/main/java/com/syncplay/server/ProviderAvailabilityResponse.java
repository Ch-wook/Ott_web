package com.syncplay.server;

import java.util.List;

public record ProviderAvailabilityResponse(
        String title,
        String region,
        List<String> userSubscriptions,
        List<ProviderStatus> providers,
        String watchLink, // 바로보기를 위한 공식 링크 추가
        List<String> debugLog
) {
    public record ProviderStatus(
            Integer providerId,
            String providerName,
            String logoPath,
            String status
    ) {}
}