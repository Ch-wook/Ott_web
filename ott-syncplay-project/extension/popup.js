const API_BASE_URL = "http://localhost:8080";

// 플랫폼별 bridge 파일 매핑
const PLATFORM_BRIDGE_FILES = {
  Netflix: "netflix-bridge.js",
  DisneyPlus: "disney-bridge.js",
  CoupangPlay: "coupang-bridge.js",
  Watcha: "watcha-bridge.js",
  Wavve: "wavve-bridge.js",
};

// 팝업 버튼 클릭 시 실행
document.getElementById("extractBtn").addEventListener("click", handleExtract);

async function handleExtract() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "영상 정보 추출 중...";

  try {
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab?.url) {
      resultDiv.innerText = "현재 탭 정보를 가져오지 못했습니다.";
      return;
    }

    // 현재 URL 기준으로 플랫폼 판별
    const platform = detectPlatform(tab.url);

    if (!platform) {
      resultDiv.innerText = "지원하지 않는 OTT 페이지입니다.";
      return;
    }

    // 플랫폼별 bridge 파일 먼저 주입
    const bridgeFile = PLATFORM_BRIDGE_FILES[platform];
    if (bridgeFile) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [bridgeFile],
      });
    }

    // 현재 페이지에 extractVideoInfo 함수 주입 후 결과 받기
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractVideoInfo,
    });

    const data = injectionResults?.[0]?.result;

    // 추출 실패 시 안내 문구 출력
    if (!data) {
      resultDiv.innerText = "데이터를 가져오지 못했습니다. 새로고침 후 다시 시도해주세요.";
      return;
    }

    // 서버로 보낼 payload 구성
    const payload = {
      platform: data.platform,
      title: data.title,
      subTitle: data.subTitle,
      progress: data.progress !== null ? String(data.progress) : "0",
      currentTime: data.currentTime,
      duration: data.duration,
      url: data.url,
      watchedAt: new Date().toISOString(),
    };

    // 백엔드 서버로 시청 기록 전송
    const resp = await fetch(`${API_BASE_URL}/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 전송 성공 시 팝업에 표시
    if (resp.ok) {
      resultDiv.innerHTML = `
        <div style="color: #2563eb; font-weight: bold;">✅ 전송 성공!</div>
        <div style="font-size: 13px; margin-top: 5px;">
          🎬 제목: ${payload.title}<br>
          📝 상세: ${payload.subTitle || "없음"}<br>
          📊 진도: ${payload.progress}%
        </div>
      `;
    } else {
      resultDiv.innerText = "서버 전송 실패";
    }
  } catch (err) {
    resultDiv.innerText = "에러 발생: " + err.message;
  }
}

// URL 기준 플랫폼 판별
function detectPlatform(url) {
  try {
    const host = new URL(url).hostname;

    if (host.includes("netflix.com")) return "Netflix";
    if (host.includes("disneyplus.com")) return "DisneyPlus";
    if (host.includes("coupangplay.com")) return "CoupangPlay";
    if (host.includes("watcha.com")) return "Watcha";
    if (host.includes("wavve.com")) return "Wavve";
    if (host.includes("tving.com")) return "TVING";

    return null;
  } catch (e) {
    return null;
  }
}

function extractVideoInfo() {
  const host = location.hostname;
  let platform = "Unknown";

  // 플랫폼 판별
  if (host.includes("netflix.com")) platform = "Netflix";
  else if (host.includes("disneyplus.com")) platform = "DisneyPlus";
  else if (host.includes("coupangplay.com")) platform = "CoupangPlay";
  else if (host.includes("watcha.com")) platform = "Watcha";
  else if (host.includes("wavve.com")) platform = "Wavve";
  else if (host.includes("tving.com")) platform = "TVING";

  // bridge 저장소
  const bridges = window.OTTPlatformBridges || {};

  // ------------------------------
  // 공통 유틸 함수들
  // ------------------------------

  // "12:34" 또는 "1:12:34" 형태 시간을 초 단위로 변환
  function parseTimeToSeconds(text) {
    if (!text) return null;

    const clean = String(text).trim().replace(/[^\d:]/g, "");
    const parts = clean.split(":").map(Number);

    if (!clean || parts.some(isNaN)) return null;

    if (parts.length === 2) {
      const [mm, ss] = parts;
      return mm * 60 + ss;
    }

    if (parts.length === 3) {
      const [hh, mm, ss] = parts;
      return hh * 3600 + mm * 60 + ss;
    }

    return null;
  }

  // shadow DOM 내부 요소 접근
  function getShadowElement(hostEl, selector) {
    try {
      if (!hostEl || !hostEl.shadowRoot) return null;
      return hostEl.shadowRoot.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  // 공백 정리
  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  // 메타 태그 content 읽기
  function getMetaContent(selector) {
    return cleanText(document.querySelector(selector)?.content || "");
  }

  // 플랫폼 bridge 가 심어둔 메타 데이터 읽기
  function readBridgeMeta(attributeName) {
    try {
      const raw = document.documentElement?.getAttribute(attributeName);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // 요소가 실제로 보이는지 검사
  function isVisible(el) {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  // 실제 재생용 video 고르기
  // 광고용 / 숨김 / 0x0 video 대응
  function getBestVideoElement() {
    const videos = [...document.querySelectorAll("video")];
    if (!videos.length) return null;

    const scoredVideos = videos.map((video, index) => {
      const rect = video.getBoundingClientRect();
      const area = rect.width * rect.height;

      let score = 0;

      if (isVisible(video)) score += 1000000;
      if (Number.isFinite(video.currentTime) && video.currentTime > 0) score += 300000;
      if (Number.isFinite(video.duration) && video.duration > 0) score += 300000;
      if (video.paused === false) score += 200000;

      score += area;

      return {
        video,
        score,
        index,
      };
    });

    scoredVideos.sort((a, b) => b.score - a.score);
    return scoredVideos[0]?.video || videos[0] || null;
  }

  // 공통 제목 분리
  function splitTitle(rawTitle) {
    let value = cleanText(rawTitle);

    value = value
      .replace(/\|\s*Netflix\s*$/i, "")
      .replace(/\|\s*넷플릭스\s*$/i, "")
      .replace(/\|\s*Disney\+\s*$/i, "")
      .replace(/\|\s*디즈니\+\s*$/i, "")
      .replace(/\|\s*Coupang Play\s*$/i, "")
      .replace(/\|\s*쿠팡플레이\s*$/i, "")
      .replace(/\|\s*WATCHA\s*$/i, "")
      .replace(/\|\s*왓챠\s*$/i, "")
      .replace(/\|\s*wavve\s*$/i, "")
      .replace(/\|\s*웨이브\s*$/i, "")
      .replace(/\|\s*TVING\s*$/i, "")
      .replace(/\|\s*티빙\s*$/i, "")
      .trim();

    if (!value) {
      return {
        title: "",
        subTitle: "",
      };
    }

    // ":" 기준으로 제목/상세 분리
    if (value.includes(":")) {
      const parts = value.split(":");
      return {
        title: cleanText(parts[0]),
        subTitle: cleanText(parts.slice(1).join(":")),
      };
    }

    // 시즌/화수 패턴 기준 분리
    const splitRegex = /(시즌\s*\d+|파트\s*\d+|제\s*\d+\s*화|\d+화|S\d+E\d+|Episode\s*\d+)/i;
    const match = value.match(splitRegex);

    if (match && match.index > 0) {
      return {
        title: cleanText(value.substring(0, match.index)),
        subTitle: cleanText(value.substring(match.index)),
      };
    }

    return {
      title: value,
      subTitle: "",
    };
  }

  // 공통 슬라이더 기반 진도 계산
  function applyCommonSliderProgress(state) {
    const sliderCandidates = [
      ...document.querySelectorAll(".scrubber-slider"),
      ...document.querySelectorAll("[role='slider']"),
      ...document.querySelectorAll("[aria-valuenow][aria-valuemax]"),
      ...document.querySelectorAll("input[type='range']"),
    ];

    for (const slider of sliderCandidates) {
      const now = parseFloat(slider.getAttribute("aria-valuenow") || slider.value);
      const max = parseFloat(slider.getAttribute("aria-valuemax") || slider.max);

      if (isNaN(now) || isNaN(max) || max <= 0) continue;

      // max가 100 이하면 퍼센트 단위로 간주
      if (max <= 100) {
        state.progress = now.toFixed(2);
        return;
      }

      // max가 100보다 크면 초 단위로 간주
      state.extractedCurrentTime = Math.floor(now);
      state.extractedDuration = Math.floor(max);
      state.progress = ((now / max) * 100).toFixed(2);
      return;
    }
  }

  const video = getBestVideoElement();

  const state = {
    mainTitle: "",
    subTitle: "",
    progress: null,
    extractedCurrentTime: video && Number.isFinite(video.currentTime) ? Math.floor(video.currentTime) : null,
    extractedDuration: video && Number.isFinite(video.duration) && video.duration > 0 ? Math.floor(video.duration) : null,
  };

  // 공통 기본 진도 계산
  if (
    state.extractedCurrentTime !== null &&
    state.extractedDuration !== null &&
    state.extractedDuration > 0
  ) {
    state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
  }

  // 공통 슬라이더 보정
  applyCommonSliderProgress(state);

  // 공통 제목 기본값
  const defaultTitle = splitTitle(document.title || "");
  if (defaultTitle.title) state.mainTitle = defaultTitle.title;
  if (defaultTitle.subTitle) state.subTitle = defaultTitle.subTitle;

  // ------------------------------
  // 플랫폼별 bridge 처리
  // ------------------------------
  if (bridges[platform] && typeof bridges[platform].extract === "function") {
    try {
      bridges[platform].extract({
        state,
        video,
        helpers: {
          parseTimeToSeconds,
          getShadowElement,
          cleanText,
          getMetaContent,
          readBridgeMeta,
          splitTitle,
        },
      });
    } catch (e) {
      console.error(`${platform} bridge error:`, e);
    }
  }

  // bridge가 없을 때 최소 fallback
  if (!state.mainTitle) {
    const fallback = splitTitle(document.title || "");
    state.mainTitle = fallback.title || "";
    if (!state.subTitle) state.subTitle = fallback.subTitle || "";
  }

  // ------------------------------
  // 공통 후처리
  // ------------------------------

  // 띄어쓰기 교정
  // 예: "3화나초" -> "3화 나초"
  if (state.subTitle) {
    state.subTitle = state.subTitle.replace(
      /(화|시즌\s*\d+|파트\s*\d+|S\d+E\d+|Episode\s*\d+)(?=[^\s:])/gi,
      "$1 "
    );
    state.subTitle = state.subTitle.replace(/\s{2,}/g, " ").trim();
  }

  // 제목이 끝까지 없으면 실패 문구
  if (!state.mainTitle || state.mainTitle === "") {
    state.mainTitle = "제목 인식 실패";
    state.subTitle = "영상 화면을 클릭한 뒤 다시 시도해주세요";
  }

  // 숫자 보정
  if (!Number.isFinite(state.extractedCurrentTime)) state.extractedCurrentTime = null;
  if (!Number.isFinite(state.extractedDuration) || state.extractedDuration <= 0) {
    state.extractedDuration = null;
  }

  // progress 재계산
  if (
    (state.progress === null || isNaN(parseFloat(state.progress))) &&
    state.extractedCurrentTime !== null &&
    state.extractedDuration !== null &&
    state.extractedDuration > 0
  ) {
    state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
  }

  // 진도 100% 초과 방지
  if (state.progress !== null && !isNaN(parseFloat(state.progress))) {
    let numericProgress = parseFloat(state.progress);

    if (numericProgress < 0) numericProgress = 0;
    if (numericProgress > 100) numericProgress = 100;

    state.progress = numericProgress.toFixed(2);
  }

  // progress 값이 아예 없으면 0 처리
  if (state.progress === null) {
    state.progress = "0";
  }

  // 최종 반환
  return {
    platform: platform,
    title: state.mainTitle,
    subTitle: state.subTitle,
    progress: state.progress,
    currentTime: state.extractedCurrentTime,
    duration: state.extractedDuration,
    url: location.href,
  };
}