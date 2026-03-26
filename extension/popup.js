const API_BASE_URL = "http://localhost:8080";

document.getElementById("extractBtn").addEventListener("click", handleExtract);

async function handleExtract() {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "영상 정보 추출 중...";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractVideoInfo,
    });

    const data = injectionResults?.[0]?.result;

    if (!data) {
      resultDiv.innerText = "데이터를 가져오지 못했습니다. 새로고침 후 다시 시도해주세요.";
      return;
    }

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

    const resp = await fetch(`${API_BASE_URL}/api/history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      resultDiv.innerHTML = `
        <div style="color: #2563eb; font-weight: bold;">✅ 전송 성공!</div>
        <div style="font-size: 13px; margin-top: 5px;">
          🎬 제목: ${payload.title}<br>
          📝 상세: ${payload.subTitle || '없음'}<br>
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

  if (host.includes("netflix.com")) platform = "Netflix";
  else if (host.includes("disneyplus.com")) platform = "DisneyPlus";

  const video = document.querySelector("video");
  let mainTitle = "";
  let subTitle = "";
  let progress = null;
  let extractedCurrentTime = video ? Math.floor(video.currentTime) : null;
  let extractedDuration = video ? Math.floor(video.duration) : null;

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

  function getShadowElement(hostEl, selector) {
    try {
      if (!hostEl || !hostEl.shadowRoot) return null;
      return hostEl.shadowRoot.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function cleanText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

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

  function extractDisneyPlusSubTitle(rawTitle) {
    const candidates = [];
    const seen = new Set();

    function addCandidate(text) {
      const cleaned = cleanText(text);
      if (!cleaned) return;
      if (seen.has(cleaned)) return;
      seen.add(cleaned);
      candidates.push(cleaned);
    }

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
      'h1',
      'h2',
      'h3'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        addCandidate(el.innerText || el.textContent || "");
      });
    });

    addCandidate(document.querySelector('meta[property="og:title"]')?.content);
    addCandidate(document.querySelector('meta[name="twitter:title"]')?.content);
    addCandidate(document.querySelector('meta[name="description"]')?.content);
    addCandidate(document.querySelector('meta[property="og:description"]')?.content);

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

    const filtered = candidates.filter(text => {
      if (!text) return false;
      if (text === rawTitle) return false;
      if (text === document.title) return false;
      if (text === mainTitle) return false;
      if (/^디즈니\+?$/i.test(text)) return false;
      if (/Audio Options|Subtitle Track Picker|Audio Track Picker|자막|오디오|일시 중지됨/i.test(text)) return false;
      if (text.length > 120) return false;
      return true;
    });

    const strongCandidate = filtered.find(text =>
      /(시즌\s*\d+|파트\s*\d+|\d+화|S\d+E\d+|Episode\s*\d+)/i.test(text)
    );

    if (strongCandidate) return strongCandidate;

    const secondCandidate = filtered.find(text =>
      text !== mainTitle &&
      !text.includes("디즈니+") &&
      !text.includes("Disney+")
    );

    return secondCandidate || "";
  }

  if (platform === "Netflix") {
    const slider = document.querySelector('.scrubber-slider, [role="slider"]');
    if (slider) {
      const now = parseFloat(slider.getAttribute('aria-valuenow'));
      const max = parseFloat(slider.getAttribute('aria-valuemax'));

      if (!isNaN(now) && !isNaN(max) && max > 0) {
        if (max <= 100) {
          progress = now.toFixed(2);
        } else {
          progress = ((now / max) * 100).toFixed(2);
          extractedCurrentTime = Math.floor(now);
          extractedDuration = Math.floor(max);
        }
      }
    }

    if (!progress && video && video.duration > 0) {
      progress = ((video.currentTime / video.duration) * 100).toFixed(2);
      extractedCurrentTime = Math.floor(video.currentTime);
      extractedDuration = Math.floor(video.duration);
    }

    let rawTitle = document.title || "";
    if (rawTitle === "Netflix" || rawTitle === "넷플릭스") {
      const titleEl = document.querySelector('[data-uia="video-title"]') || document.querySelector('.video-title');
      if (titleEl) rawTitle = titleEl.innerText;
    }

    rawTitle = rawTitle.replace(/넷플릭스/g, "").replace(/Netflix/g, "").replace(/\|/g, "").trim();
    rawTitle = rawTitle.replace(/^-|-$/g, "").trim();

    if (rawTitle.includes(':')) {
      const parts = rawTitle.split(':');
      mainTitle = parts[0].trim();
      subTitle = parts.slice(1).join(':').trim();
    } else {
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

      // thumb 값 실패 시 width % 백업
      if ((!progress || isNaN(parseFloat(progress))) && progressEl) {
        const widthPercent = parseFloat(progressEl.style.width);
        if (!isNaN(widthPercent)) {
          progress = widthPercent.toFixed(2);
        }
      }
    }

    // 2차: 남은 시간 + 현재시간으로 duration 복원
    if ((!extractedDuration || !isFinite(extractedDuration)) && timeRemainingIndicator) {
      const remainingTextEl = getShadowElement(timeRemainingIndicator, ".time-remaining-indicator");
      const remainingText = remainingTextEl ? remainingTextEl.textContent.trim() : "";
      const remainingSeconds = parseTimeToSeconds(remainingText);

      if (remainingSeconds !== null && extractedCurrentTime !== null && isFinite(extractedCurrentTime)) {
        extractedDuration = Math.floor(extractedCurrentTime + remainingSeconds);
      }
    }

    // 3차: video 백업
    if ((extractedCurrentTime === null || !isFinite(extractedCurrentTime)) && video && isFinite(video.currentTime)) {
      extractedCurrentTime = Math.floor(video.currentTime);
    }

    if ((extractedDuration === null || !isFinite(extractedDuration) || extractedDuration <= 0) &&
        video && isFinite(video.duration) && video.duration > 0) {
      extractedDuration = Math.floor(video.duration);
    }

    // 4차: progress 백업 계산
    if ((!progress || isNaN(parseFloat(progress))) &&
        extractedCurrentTime !== null &&
        extractedDuration !== null &&
        extractedDuration > 0) {
      progress = ((extractedCurrentTime / extractedDuration) * 100).toFixed(2);
    }

    // bridge가 심어준 메타 우선 사용
    if (disneyMeta) {
      if (disneyMeta.title) mainTitle = disneyMeta.title;
      if (disneyMeta.subTitle) subTitle = disneyMeta.subTitle;

      if ((!extractedDuration || !isFinite(extractedDuration) || extractedDuration <= 0) &&
          disneyMeta.runtimeMs) {
        extractedDuration = Math.floor(disneyMeta.runtimeMs / 1000);
      }
    }

    // 제목 / 상세 추출 fallback
    if (!mainTitle) {
      let rawTitle = document.title || "";
      rawTitle = rawTitle
        .replace(/\|\s*디즈니\+\s*$/i, "")
        .replace(/\|\s*Disney\+\s*$/i, "")
        .trim();

      if (rawTitle.includes(':')) {
        const parts = rawTitle.split(':');
        mainTitle = parts[0].trim();
        if (!subTitle) subTitle = parts.slice(1).join(':').trim();
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

    if (!subTitle) {
      subTitle = extractDisneyPlusSubTitle(mainTitle);
    }
  }

  if (subTitle) {
    subTitle = subTitle.replace(/(화|시즌\s*\d+|파트\s*\d+|S\d+E\d+|Episode\s*\d+)(?=[^\s:])/g, '$1 ');
    subTitle = subTitle.replace(/\s{2,}/g, ' ').trim();
  }

  if (!mainTitle || mainTitle === "") {
    mainTitle = "제목 인식 실패";
    subTitle = "영상 화면을 클릭한 뒤 다시 시도해주세요";
  }

  if (progress !== null && !isNaN(parseFloat(progress)) && parseFloat(progress) > 100) {
    progress = "100.00";
  }

  if (progress === null) {
    progress = "0";
  }

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