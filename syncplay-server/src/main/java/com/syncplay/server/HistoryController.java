package com.syncplay.server;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@CrossOrigin(origins = "*") // 프론트엔드 연동을 위한 CORS 허용
public class HistoryController {

    // 데이터베이스 대신 사용할 메모리 저장소 (List)
    private List<WatchHistory> historyList = new ArrayList<>();
    // 고유 ID를 부여하기 위한 카운터
    private Long idCounter = 1L;

    // 1. 시청 기록 조회 (대시보드 화면용)
    @GetMapping("/api/history")
    public List<WatchHistory> getHistory() {
        return historyList;
    }

    // 2. 시청 기록 저장 및 업데이트 (확장 프로그램 전송용)
    @PostMapping("/api/history")
    public ResponseEntity<?> saveOrUpdateHistory(@RequestBody WatchHistory payload) {
        
        WatchHistory existing = null;

        // 이미 시청 중인 동일한 제목의 작품이 있는지 리스트에서 검색합니다.
        for (WatchHistory history : historyList) {
            if (history.getTitle() != null && history.getTitle().equals(payload.getTitle())) {
                existing = history;
                break;
            }
        }

        if (existing != null) {
            // [업데이트] 이미 시청 중이라면 퍼센트, 부제목(N화), 이어보기 주소 등을 최신으로 덮어씌웁니다.
            existing.setProgress(payload.getProgress());
            existing.setSubTitle(payload.getSubTitle()); 
            existing.setUrl(payload.getUrl());           
            existing.setCurrentTime(payload.getCurrentTime());
            existing.setDuration(payload.getDuration());
            existing.setWatchedAt(payload.getWatchedAt());

            return ResponseEntity.ok("기록 업데이트 완료");
        } else {
            // [새로 저장] 처음 보는 작품이면 새 ID를 부여하고 리스트에 추가합니다.
            payload.setId(idCounter++);
            historyList.add(payload);
            return ResponseEntity.ok("새 기록 저장 완료");
        }
    }

    // 3. 시청 기록 삭제 (휴지통 버튼용)
    @DeleteMapping("/api/history/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        // 리스트에서 해당 ID를 가진 기록을 찾아 삭제합니다.
        boolean removed = historyList.removeIf(history -> history.getId().equals(id));
        
        if (removed) {
            return ResponseEntity.ok().body("삭제 완료");
        } else {
            return ResponseEntity.badRequest().body("삭제 실패: 데이터를 찾을 수 없습니다.");
        }
    }
}