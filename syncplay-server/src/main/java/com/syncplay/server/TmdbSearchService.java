package com.syncplay.server;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

@Service
public class TmdbSearchService {

    private static final String TMDB_BASE_URL = "https://api.themoviedb.org/3";
    private final WebClient webClient;
    private final String tmdbAccessToken;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UserSubscriptionService userSubscriptionService;

    public TmdbSearchService(
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

    public List<Map<String, Object>> searchGlobal(String query, String email, String region) {
        if (tmdbAccessToken == null || tmdbAccessToken.isBlank()) {
            return Collections.emptyList();
        }

        // 1. TMDB Search
        String searchResponse = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search/multi")
                        .queryParam("query", query)
                        .queryParam("include_adult", "false")
                        .queryParam("language", "ko-KR")
                        .build())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tmdbAccessToken)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode root = safeReadTree(searchResponse);
        if (root == null || !root.has("results")) return Collections.emptyList();

        List<String> userSubs = userSubscriptionService.getSubscriptions(email);
        Set<String> normalizedSubs = new HashSet<>();
        for (String sub : userSubs) {
            normalizedSubs.add(normalize(sub));
        }

        List<Map<String, Object>> finalResults = new ArrayList<>();
        for (JsonNode item : root.path("results")) {
            String mediaType = item.path("media_type").asText();
            if (!"movie".equals(mediaType) && !"tv".equals(mediaType)) continue;

            Map<String, Object> result = new HashMap<>();
            String title = item.has("title") ? item.path("title").asText() : item.path("name").asText();
            result.put("id", item.path("id").asInt());
            result.put("title", title);
            result.put("mediaType", mediaType);
            result.put("posterUrl", item.path("poster_path").isNull() ? null : "https://image.tmdb.org/t/p/w500" + item.path("poster_path").asText());
            result.put("overview", item.path("overview").asText());
            result.put("rating", item.path("vote_average").asDouble());

            // 2. Fetch Providers for each result
            result.put("providerStatuses", fetchProvidersForId(item.path("id").asInt(), mediaType, region, normalizedSubs));
            
            finalResults.add(result);
        }

        return finalResults;
    }

    private List<Map<String, Object>> fetchProvidersForId(int id, String mediaType, String region, Set<String> normalizedSubs) {
        String path = "/" + mediaType + "/" + id + "/watch/providers";
        String response = webClient.get()
                .uri(path)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + tmdbAccessToken)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode root = safeReadTree(response);
        if (root == null || !root.has("results")) return Collections.emptyList();

        JsonNode regionNode = root.path("results").path(region.toUpperCase(Locale.ROOT));
        if (regionNode.isMissingNode()) return Collections.emptyList();

        List<Map<String, Object>> providers = new ArrayList<>();
        Set<Integer> seenIds = new HashSet<>();

        processProviderNode(regionNode.path("flatrate"), providers, seenIds, normalizedSubs);
        processProviderNode(regionNode.path("rent"), providers, seenIds, normalizedSubs);
        processProviderNode(regionNode.path("buy"), providers, seenIds, normalizedSubs);

        return providers;
    }

    private void processProviderNode(JsonNode node, List<Map<String, Object>> list, Set<Integer> seenIds, Set<String> normalizedSubs) {
        if (node.isArray()) {
            for (JsonNode p : node) {
                int pid = p.path("provider_id").asInt();
                if (seenIds.contains(pid)) continue;
                seenIds.add(pid);

                String name = p.path("provider_name").asText();
                Map<String, Object> pMap = new HashMap<>();
                pMap.put("providerId", pid);
                pMap.put("providerName", name);
                pMap.put("logoPath", p.path("logo_path").asText());
                pMap.put("status", normalizedSubs.contains(normalize(name)) ? "SUBSCRIBED" : "PURCHASE_REQUIRED");
                list.add(pMap);
            }
        }
    }

    private String normalize(String s) {
        return s.toLowerCase(Locale.ROOT).replace(" ", "").replace("+", "plus");
    }

    private JsonNode safeReadTree(String body) {
        try { return objectMapper.readTree(body); } catch (Exception e) { return null; }
    }
}
