package com.syncplay.server;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/tmdb")
@CrossOrigin(origins = "http://localhost:5173")
public class TmdbSearchController {

    private final TmdbSearchService tmdbSearchService;

    public TmdbSearchController(TmdbSearchService tmdbSearchService) {
        this.tmdbSearchService = tmdbSearchService;
    }

    @GetMapping("/search")
    public List<Map<String, Object>> search(
            @RequestParam String query,
            @RequestParam String email,
            @RequestParam(defaultValue = "KR") String region
    ) {
        return tmdbSearchService.searchGlobal(query, email, region);
    }
}
