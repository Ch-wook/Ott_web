const API_BASE_URL = "http://localhost:8080";

// 팝업 버튼 클릭 시 실행
document.getElementById("extractBtn").addEventListener("click", handleExtract);

async function handleExtract() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "영상 정보 추출 중...";

  try {
    // 현재 활성 탭 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 현재 페이지에 extractVideoInfo 함수 주입 후 결과 받기
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractVideoInfo,
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
      watchedAt: new Date().toISOString()
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

function extractVideoInfo() {
  const host = location.hostname;
  let platform = "Unknown";

  // 플랫폼 판별
  if (host.includes("netflix.com")) platform = "Netflix";
  else if (host.includes("disneyplus.com")) platform = "DisneyPlus";

  const video = document.querySelector("video");

  let mainTitle = "";
  let subTitle = "";
  let progress = null;

  // 기본 currentTime / duration
  let extractedCurrentTime = video ? Math.floor(video.currentTime) : null;
  let extractedDuration = video ? Math.floor(video.duration) : null;

  // ------------------------------
  // 공통 유틸 함수들
  // ------------------------------

  // "12:34" 또는 "1:12:34" 형태 시간을 초 단위로 변환
  function parseTimeToSeconds(text) {
    if (!text) return null;

    const clean = String(text).trim();
    const parts = clean.split(":").map(Number);

    if (parts.some(isNaN)) return null;

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

  // disney-bridge.js 가 심어둔 메타 데이터 읽기
  function readDisneyMeta() {
    try {
      const raw =
        document.documentElement?.dataset?.ottDisneyMeta ||
        document.documentElement?.getAttribute("data-ott-disney-meta");

      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // 디즈니에서 상세 후보를 찾을 때,
  // 자막/오디오 설정창 텍스트인지 판별해서 제외
  function isDisneyUiNoise(text, el) {
    const cleaned = cleanText(text);
    const classAndId = `${el?.className || ""} ${el?.id || ""}`;

    if (!cleaned) return true;

    // 설정창 관련 클래스/아이디는 전부 제외
    if (
      /audio-subtitles|subtitleTrackPicker|audioTrackPicker|options-picker|drawer-content|audio-subtitles-control|audio-subtitles-drawer/i.test(classAndId)
    ) {
      return true;
    }

    // 자막/오디오 관련 텍스트도 제외
    if (
      /Audio Options|Subtitle Track Picker|Audio Track Picker|자막|오디오|일시 중지됨|꺼짐|\[CC\]|English|한국어/i.test(cleaned)
    ) {
      return true;
    }

    // 디즈니 로고나 잡 UI 문구 제외
    if (
      cleaned.includes("Audio Options") ||
      cleaned.includes("Disney+") ||
      cleaned.includes("디즈니+")
    ) {
      return true;
    }

    return false;
  }

  // 디즈니 상세(subTitle) fallback 추출
  function extractDisneyPlusSubTitle(rawTitle) {
    const candidates = [];
    const seen = new Set();

    // 후보 추가 함수
    function addCandidate(text, el = null) {
      const cleaned = cleanText(text);
      if (!cleaned) return;
      if (seen.has(cleaned)) return;
      if (isDisneyUiNoise(cleaned, el)) return;

      seen.add(cleaned);
      candidates.push(cleaned);
    }

    // 후보가 있을 법한 셀렉터들
    const selectors = [
      '[data-testid*="episode"]',
      '[data-testid*="title"]',
      '[data-testid*="subtitle"]',
      '[aria-label*="episode" i]',
      '[aria-label*="subtitle" i]',
      '[class*="episode"]',
      '[class*="subtitle"]',
      '[class*="sub-title"]',
      '[class*="metadata"]',
      "h1",
      "h2",
      "h3"
    ];

    // 화면 요소에서 후보 수집
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        addCandidate(el.innerText || el.textContent || "", el);
      });
    });

    // 메타 태그에서도 후보 수집
    addCandidate(document.querySelector('meta[property="og:title"]')?.content);
    addCandidate(document.querySelector('meta[name="twitter:title"]')?.content);
    addCandidate(document.querySelector('meta[name="description"]')?.content);
    addCandidate(document.querySelector('meta[property="og:description"]')?.content);

    // script 내부 JSON/문자열에서도 에피소드 정보 패턴 탐색
    const jsonTexts = [...document.querySelectorAll('script[type="application/ld+json"], script')]
      .map(script => script.textContent || "")
      .slice(0, 30);

    jsonTexts.forEach(text => {
      const patterns = [
        /"episodeTitle"\s*:\s*"([^"]+)"/i,
        /"subtitle"\s*:\s*"([^"]+)"/i,
        /"subTitle"\s*:\s*"([^"]+)"/i,
        /"episodeNumber"\s*:\s*"([^"]+)"/i,
        /"episodeNumber"\s*:\s*([0-9]+)/i,
        /"seasonNumber"\s*:\s*"([^"]+)"/i,
        /"seasonNumber"\s*:\s*([0-9]+)/i
      ];

      patterns.forEach(pattern => {
        const match = text.match(pattern);
        if (match && match[1]) addCandidate(match[1]);
      });
    });

    // 최종 필터
    const filtered = candidates.filter(text => {
      if (!text) return false;
      if (text === rawTitle) return false;
      if (text === document.title) return false;
      if (text === mainTitle) return false;
      if (/^디즈니\+?$/i.test(text)) return false;
      if (text.length > 120) return false;
      return true;
    });

    // 시즌/화수 패턴이 있는 강한 후보만 채택
    const strongCandidate = filtered.find(text =>
      /(시즌\s*\d+|파트\s*\d+|\d+화|S\d+E\d+|Episode\s*\d+)/i.test(text)
    );

    if (strongCandidate) return strongCandidate;

    // 애매하면 억지로 상세를 넣지 않음
    return "";
  }

  // ------------------------------
  // Netflix 처리
  // ------------------------------
  if (platform === "Netflix") {
    // [개선] 광고/노란 구간 대응:
    // 재생바 슬라이더 값으로 진도 계산
    const slider = document.querySelector(".scrubber-slider, [role='slider']");
    if (slider) {
      const now = parseFloat(slider.getAttribute("aria-valuenow"));
      const max = parseFloat(slider.getAttribute("aria-valuemax"));

      if (!isNaN(now) && !isNaN(max) && max > 0) {
        // max가 100 이하면 이미 퍼센트 단위
        if (max <= 100) {
          progress = now.toFixed(2);
        } else {
          // max가 100보다 크면 초 단위로 판단
          progress = ((now / max) * 100).toFixed(2);
          extractedCurrentTime = Math.floor(now);
          extractedDuration = Math.floor(max);
        }
      }
    }

    // 슬라이더 실패 시 video 태그로 백업
    if (!progress && video && video.duration > 0) {
      progress = ((video.currentTime / video.duration) * 100).toFixed(2);
      extractedCurrentTime = Math.floor(video.currentTime);
      extractedDuration = Math.floor(video.duration);
    }

    // 제목 추출
    let rawTitle = document.title || "";
    if (rawTitle === "Netflix" || rawTitle === "넷플릭스") {
      const titleEl =
        document.querySelector('[data-uia="video-title"]') ||
        document.querySelector(".video-title");
      if (titleEl) rawTitle = titleEl.innerText;
    }

    // 불필요한 문자열 제거
    rawTitle = rawTitle.replace(/넷플릭스/g, "").replace(/Netflix/g, "").replace(/\|/g, "").trim();
    rawTitle = rawTitle.replace(/^-|-$/g, "").trim();

    // ":" 기준으로 제목/상세 분리
    if (rawTitle.includes(":")) {
      const parts = rawTitle.split(":");
      mainTitle = parts[0].trim();
      subTitle = parts.slice(1).join(":").trim();
    } else {
      // 시즌/화수 패턴 기준 분리
      const splitRegex = /(시즌\s*\d+|파트\s*\d+|\d+화|S\d+E\d+|Episode\s*\d+)/;
      const match = rawTitle.match(splitRegex);
      if (match && match.index > 0) {
        mainTitle = rawTitle.substring(0, match.index).trim();
        subTitle = rawTitle.substring(match.index).trim();
      } else {
        mainTitle = rawTitle;
      }
    }
  }

  // ------------------------------
  // DisneyPlus 처리
  // ------------------------------
  if (platform === "DisneyPlus") {
    const disneyMeta = readDisneyMeta();
    const progressBar = document.querySelector("progress-bar");
    const timeRemainingIndicator = document.querySelector("time-remaining-indicator");

    // 1차: shadow DOM 진행바 값 추출
    if (progressBar) {
      const thumb = getShadowElement(progressBar, ".progress-bar__thumb");
      const progressEl = getShadowElement(progressBar, ".progress-bar__progress");

      if (thumb) {
        const now = parseFloat(thumb.getAttribute("aria-valuenow"));
        const max = parseFloat(thumb.getAttribute("aria-valuemax"));

        if (!isNaN(now)) extractedCurrentTime = Math.floor(now);
        if (!isNaN(max) && max > 0) extractedDuration = Math.floor(max);

        if (!isNaN(now) && !isNaN(max) && max > 0) {
          progress = ((now / max) * 100).toFixed(2);
        }
      }

      // thumb 값 실패 시 progress width(%) 사용
      if ((!progress || isNaN(parseFloat(progress))) && progressEl) {
        const widthPercent = parseFloat(progressEl.style.width);
        if (!isNaN(widthPercent)) {
          progress = widthPercent.toFixed(2);
        }
      }
    }

    // 2차: 남은 시간 + 현재시간으로 전체 duration 복원
    if ((!extractedDuration || !isFinite(extractedDuration)) && timeRemainingIndicator) {
      const remainingTextEl = getShadowElement(timeRemainingIndicator, ".time-remaining-indicator");
      const remainingText = remainingTextEl ? remainingTextEl.textContent.trim() : "";
      const remainingSeconds = parseTimeToSeconds(remainingText);

      if (remainingSeconds !== null && extractedCurrentTime !== null && isFinite(extractedCurrentTime)) {
        extractedDuration = Math.floor(extractedCurrentTime + remainingSeconds);
      }
    }

    // 3차: video 태그 백업
    if ((extractedCurrentTime === null || !isFinite(extractedCurrentTime)) && video && isFinite(video.currentTime)) {
      extractedCurrentTime = Math.floor(video.currentTime);
    }

    if (
      (extractedDuration === null || !isFinite(extractedDuration) || extractedDuration <= 0) &&
      video &&
      isFinite(video.duration) &&
      video.duration > 0
    ) {
      extractedDuration = Math.floor(video.duration);
    }

    // 4차: currentTime / duration으로 progress 계산
    if (
      (!progress || isNaN(parseFloat(progress))) &&
      extractedCurrentTime !== null &&
      extractedDuration !== null &&
      extractedDuration > 0
    ) {
      progress = ((extractedCurrentTime / extractedDuration) * 100).toFixed(2);
    }

    // bridge 메타 우선 사용
    if (disneyMeta) {
      if (disneyMeta.title) mainTitle = disneyMeta.title;
      if (disneyMeta.subTitle) subTitle = disneyMeta.subTitle;

      // runtimeMs가 있으면 duration 보정
      if (
        (!extractedDuration || !isFinite(extractedDuration) || extractedDuration <= 0) &&
        disneyMeta.runtimeMs
      ) {
        extractedDuration = Math.floor(disneyMeta.runtimeMs / 1000);
      }

      // [중요] 영화는 상세가 비어 있는 경우가 많음
      // 이때 fallback을 타면 "자막 꺼짐" 같은 잡텍스트가 들어오므로 차단
      if (disneyMeta.programType === "movie" && !disneyMeta.subTitle) {
        subTitle = "";
      }
    }

    // 제목 fallback
    if (!mainTitle) {
      let rawTitle = document.title || "";
      rawTitle = rawTitle
        .replace(/\|\s*디즈니\+\s*$/i, "")
        .replace(/\|\s*Disney\+\s*$/i, "")
        .trim();

      if (rawTitle.includes(":")) {
        const parts = rawTitle.split(":");
        mainTitle = parts[0].trim();
        if (!subTitle) subTitle = parts.slice(1).join(":").trim();
      } else {
        const splitRegex = /(시즌\s*\d+|파트\s*\d+|\d+화|S\d+E\d+|Episode\s*\d+)/;
        const match = rawTitle.match(splitRegex);
        if (match && match.index > 0) {
          mainTitle = rawTitle.substring(0, match.index).trim();
          if (!subTitle) subTitle = rawTitle.substring(match.index).trim();
        } else {
          mainTitle = rawTitle;
        }
      }
    }

    // 상세 fallback
    // 영화는 fallback 금지
    // 시리즈만 subtitle 후보 추출 허용
    if (!subTitle) {
      if (disneyMeta?.programType === "movie") {
        subTitle = "";
      } else {
        subTitle = extractDisneyPlusSubTitle(mainTitle);
      }
    }
  }

  // ------------------------------
  // 공통 후처리
  // ------------------------------

  // 띄어쓰기 교정
  // 예: "3화나초" -> "3화 나초"
  if (subTitle) {
    subTitle = subTitle.replace(
      /(화|시즌\s*\d+|파트\s*\d+|S\d+E\d+|Episode\s*\d+)(?=[^\s:])/g,
      "$1 "
    );
    subTitle = subTitle.replace(/\s{2,}/g, " ").trim();
  }

  // 제목이 끝까지 없으면 실패 문구
  if (!mainTitle || mainTitle === "") {
    mainTitle = "제목 인식 실패";
    subTitle = "영상 화면을 클릭한 뒤 다시 시도해주세요";
  }

  // 진도 100% 초과 방지
  if (progress !== null && !isNaN(parseFloat(progress)) && parseFloat(progress) > 100) {
    progress = "100.00";
  }

  // progress 값이 아예 없으면 0 처리
  if (progress === null) {
    progress = "0";
  }

  // 최종 반환
  return {
    platform: platform,
    title: mainTitle,
    subTitle: subTitle,
    progress: progress,
    currentTime: extractedCurrentTime,
    duration: extractedDuration,
    url: location.href
  };
}