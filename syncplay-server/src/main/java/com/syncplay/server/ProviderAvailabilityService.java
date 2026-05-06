package com.syncplay.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ProviderAvailabilityService {

    private static final String TMDB_BASE_URL = "https://api.themoviedb.org/3";
    private static final String STATUS_SUBSCRIBED = "SUBSCRIBED";
    private static final String STATUS_PURCHASE_REQUIRED = "PURCHASE_REQUIRED";

    private final WebClient webClient;
    private final UserSubscriptionService userSubscriptionService;
    private final String tmdbAccessToken;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private record TmdbIdAndType(Integer id, String mediaType) {}

    public ProviderAvailabilityService(
            UserSubscriptionService userSubscriptionService,
            @Value("${tmdb.access-token:}") String tmdbAccessToken
    ) {
        this.userSubscriptionService = userSubscriptionService;
        this.tmdbAccessToken = tmdbAccessToken;
        this.webClient = WebClient.builder()
                .baseUrl(TMDB_BASE_URL)
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .build();
    }

    public ProviderAvailabilityResponse getAvailabilityByTitle(String title, String email, String region) {
        List<String> subscriptions = userSubscriptionService.getSubscriptions(email);
        if (tmdbAccessToken == null || tmdbAccessToken.isBlank()) {
            return new ProviderAvailabilityResponse(title, region, subscriptions, List.of(), "", List.of("TMDB access token is missing."));
        }

        TmdbIdAndType tmdbIdAndType = findTmdbIdAndType(title);
        if (tmdbIdAndType == null || tmdbIdAndType.id == null || tmdbIdAndType.mediaType == null) {
            return new ProviderAvailabilityResponse(title, region, subscriptions, List.of(), "", List.of("Failed to find TMDB ID for title: " + title));
        }

        return getProvidersByItem(title, region, tmdbIdAndType, subscriptions);
    }

    private TmdbIdAndType findTmdbIdAndType(String title) {
        String responseBody = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/multi")
                        .queryParam("query", title)
                        .queryParam("include_adult", "false")
                        .queryParam("language", "ko-KR")
                        .queryParam("page", "1")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tmdbAccessToken)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (responseBody == null || responseBody.isBlank()) {
            return null;
        }

        JsonNode response = safeReadTree(responseBody);
        if (response == null || !response.has("results")) {
            return null;
        }

        for (JsonNode item : response.path("results")) {
            String mediaType = item.path("media_type").asText("");
            if ("movie".equals(mediaType)) {
                return new TmdbIdAndType(item.path("id").asInt(), mediaType);
            }
        }
        for (JsonNode item : response.path("results")) {
            String mediaType = item.path("media_type").asText("");
            if ("movie".equals(mediaType) || "tv".equals(mediaType)) {
                return new TmdbIdAndType(item.path("id").asInt(), mediaType);
            }
        }

        return null;
    }

    private ProviderAvailabilityResponse getProvidersByItem(
            String title,
            String region,
            TmdbIdAndType tmdbIdAndType,
            List<String> subscriptions
    ) {
        String mediaType = tmdbIdAndType.mediaType;
        Integer tmdbId = tmdbIdAndType.id;

        String providerPath;
        if ("tv".equals(mediaType)) {
            providerPath = "/tv/{id}/watch/providers";
        } else {
            providerPath = "/movie/{id}/watch/providers";
        }

        String watchResponseBody = webClient.get()
                .uri(providerPath, tmdbId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tmdbAccessToken)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        if (watchResponseBody == null || watchResponseBody.isBlank()) {
            return new ProviderAvailabilityResponse(title, region, subscriptions, List.of(), "", List.of("TMDB watch provider response was empty."));
        }

        JsonNode watchResponse = safeReadTree(watchResponseBody);
        if (watchResponse == null || !watchResponse.has("results")) {
            return new ProviderAvailabilityResponse(title, region, subscriptions, List.of(), "", List.of("TMDB watch provider response had no results."));
        }

        JsonNode regionNode = watchResponse.path("results").path(region.toUpperCase(Locale.ROOT));
        if (regionNode.isMissingNode()) {
            return new ProviderAvailabilityResponse(title, region, subscriptions, List.of(), "", List.of("TMDB watch provider response had no results for region: " + region));
        }

        // 바로보기를 위한 공식 링크 추출
        String watchLink = regionNode.path("link").asText("");

        Map<String, JsonNode> candidates = new HashMap<>();
        Set<Integer> seenProviderIds = new HashSet<>();
        collectProviders(regionNode.path("flatrate"), candidates, seenProviderIds);
        collectProviders(regionNode.path("rent"), candidates, seenProviderIds);
        collectProviders(regionNode.path("buy"), candidates, seenProviderIds);

        List<String> debugLog = new ArrayList<>();
        debugLog.add("--- User Subscriptions ---");
        debugLog.add("Raw: " + subscriptions);

        Set<String> subscriptionSet = new HashSet<>();
        for (String subscription : subscriptions) {
            String normalized = normalizePlatformName(subscription);
            subscriptionSet.add(normalized);
            debugLog.add("Normalized: " + subscription + " -> " + normalized);
        }
        debugLog.add("Final Set: " + subscriptionSet);
        debugLog.add("--- TMDB Providers ---");

        List<ProviderAvailabilityResponse.ProviderStatus> results = new ArrayList<>();
        for (JsonNode provider : candidates.values()) {
            String providerName = provider.path("provider_name").asText("");
            String normalizedProviderName = normalizePlatformName(providerName);
            debugLog.add("TMDB: " + providerName + " -> " + normalizedProviderName);

            String status = subscriptionSet.contains(normalizedProviderName)
                    ? STATUS_SUBSCRIBED
                    : STATUS_PURCHASE_REQUIRED;
            results.add(new ProviderAvailabilityResponse.ProviderStatus(
                    provider.path("provider_id").asInt(),
                    providerName,
                    provider.path("logo_path").asText(""),
                    status
            ));
        }

        results.sort(Comparator.comparing(ProviderAvailabilityResponse.ProviderStatus::providerName));
        return new ProviderAvailabilityResponse(title, region, subscriptions, results, watchLink, debugLog);
    }

    private String normalizePlatformName(String value) {
        if (value == null) {
            return "";
        }
        return value.toLowerCase(Locale.ROOT)
                .replace(" ", "")
                .replace("+", "plus");
    }

    private JsonNode safeReadTree(String body) {
        try {
            return objectMapper.readTree(body);
        } catch (Exception e) {
            return null;
        }
    }

    private void collectProviders(JsonNode listNode, Map<String, JsonNode> sink, Set<Integer> seenProviderIds) {
        if (listNode == null || !listNode.isArray()) {
            return;
        }
        for (JsonNode provider : listNode) {
            int providerId = provider.path("provider_id").asInt(-1);
            if (providerId == -1 || seenProviderIds.contains(providerId)) {
                continue;
            }
            seenProviderIds.add(providerId);
            sink.put(provider.path("provider_name").asText(""), provider);
        }
    }
}