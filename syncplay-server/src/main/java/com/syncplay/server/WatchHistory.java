// WatchHistory.java 전체 코드 (src/main/java/com/syncplay/server/WatchHistory.java)

package com.syncplay.server;

public class WatchHistory {
    private Long id;
    private String platform;
    private String title;      // [검색용] 메인 제목 (예: 미스터리 수사단)
    private String subTitle;   // [표시용] 회차 정보 (예: 1화 악마의 사제 파트1)
    private String progress;
    private Integer currentTime;
    private Integer duration;
    private String url;
    private String watchedAt;

    public WatchHistory() {}

    // 필드 추가에 따른 Getter/Setter 추가
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubTitle() { return subTitle; }
    public void setSubTitle(String subTitle) { this.subTitle = subTitle; }

    public String getProgress() { return progress; }
    public void setProgress(String progress) { this.progress = progress; }

    public Integer getCurrentTime() { return currentTime; }
    public void setCurrentTime(Integer currentTime) { this.currentTime = currentTime; }

    public Integer getDuration() { return duration; }
    public void setDuration(Integer duration) { this.duration = duration; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getWatchedAt() { return watchedAt; }
    public void setWatchedAt(String watchedAt) { this.watchedAt = watchedAt; }
}