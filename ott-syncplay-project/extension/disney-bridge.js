(() => {
  if (window.__OTT_DISNEY_BRIDGE_INSTALLED__) return;
  window.__OTT_DISNEY_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  function parseSeasonEpisode(subTitle, internalTitle) {
    let seasonNumber = null;
    let episodeNumber = null;

    if (subTitle) {
      const seasonMatch = subTitle.match(/시즌\s*(\d+)/i);
      const episodeMatch1 = subTitle.match(/제\s*(\d+)\s*화/i);
      const episodeMatch2 = subTitle.match(/(\d+)\s*회/i);

      if (seasonMatch) seasonNumber = Number(seasonMatch[1]);
      if (episodeMatch1) {
        episodeNumber = Number(episodeMatch1[1]);
      } else if (episodeMatch2) {
        episodeNumber = Number(episodeMatch2[1]);
      }
    }

    if ((seasonNumber === null || episodeNumber === null) && internalTitle) {
      const internalMatch = internalTitle.match(/s(\d+)e(\d+)/i);
      if (internalMatch) {
        if (seasonNumber === null) seasonNumber = Number(internalMatch[1]);
        if (episodeNumber === null) episodeNumber = Number(internalMatch[2]);
      }
    }

    return { seasonNumber, episodeNumber };
  }

  function setDisneyMeta(playerExperience) {
    if (!playerExperience || typeof playerExperience !== "object") return;

    const title = playerExperience.title || "";
    const subTitle = playerExperience.subtitle || "";
    const subtitleTts = playerExperience.subtitleTts || "";
    const runtimeMs = playerExperience.timeline?.runtimeMs ?? null;
    const programType = playerExperience.analytics?.programType || "";
    const internalTitle = playerExperience.internalTitle || "";
    const availId = playerExperience.availId || "";

    const { seasonNumber, episodeNumber } = parseSeasonEpisode(subTitle, internalTitle);

    const meta = {
      title,
      subTitle,
      subtitleTts,
      runtimeMs,
      programType,
      internalTitle,
      availId,
      seasonNumber,
      episodeNumber,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (document.documentElement) {
        document.documentElement.setAttribute("data-ott-disney-meta", JSON.stringify(meta));
      }
    } catch (e) {}
  }

  function extractPlayerExperience(payload) {
    if (!payload || typeof payload !== "object") return null;

    if (payload.data?.playerExperience) return payload.data.playerExperience;
    if (payload.playerExperience) return payload.playerExperience;

    return null;
  }

  function handlePayload(payload) {
    try {
      const playerExperience = extractPlayerExperience(payload);
      if (!playerExperience) return;

      const hasUsefulData =
        playerExperience.title ||
        playerExperience.subtitle ||
        playerExperience.subtitleTts ||
        playerExperience.timeline?.runtimeMs ||
        playerExperience.internalTitle;

      if (!hasUsefulData) return;

      setDisneyMeta(playerExperience);
    } catch (e) {}
  }

  const urlRegex = /bamgrid\.com\/(explore|v1\/public\/graphql|graph\/v1\/device\/graphql)/i;

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = String(args[0]?.url || args[0] || "");
      if (!urlRegex.test(url)) return response;

      const clone = response.clone();
      const contentType = clone.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        const json = await clone.json();
        handlePayload(json);
      } else {
        const text = await clone.text();
        try {
          handlePayload(JSON.parse(text));
        } catch (e) {}
      }
    } catch (e) {}

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__ottDisneyUrl = url;
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      try {
        const url = String(this.__ottDisneyUrl || "");
        if (!urlRegex.test(url)) return;

        const text = this.responseText || "";
        if (!text) return;

        try {
          handlePayload(JSON.parse(text));
        } catch (e) {}
      } catch (e) {}
    });

    return originalSend.apply(this, args);
  };

  // 디즈니에서 상세 후보를 찾을 때,
  // 자막/오디오 설정창 텍스트인지 판별해서 제외
  function isDisneyUiNoise(text, el, cleanText) {
    const cleaned = cleanText(text);
    const classAndId = `${el?.className || ""} ${el?.id || ""}`;

    if (!cleaned) return true;

    if (
      /audio-subtitles|subtitleTrackPicker|audioTrackPicker|options-picker|drawer-content|audio-subtitles-control|audio-subtitles-drawer/i.test(classAndId)
    ) {
      return true;
    }

    if (
      /Audio Options|Subtitle Track Picker|Audio Track Picker|자막|오디오|일시 중지됨|꺼짐|\[CC\]|English|한국어/i.test(cleaned)
    ) {
      return true;
    }

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
  function extractDisneyPlusSubTitle(rawTitle, mainTitle, cleanText) {
    const candidates = [];
    const seen = new Set();

    function addCandidate(text, el = null) {
      const cleaned = cleanText(text);
      if (!cleaned) return;
      if (seen.has(cleaned)) return;
      if (isDisneyUiNoise(cleaned, el, cleanText)) return;

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
      "h1",
      "h2",
      "h3",
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        addCandidate(el.innerText || el.textContent || "", el);
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
        /"seasonNumber"\s*:\s*([0-9]+)/i,
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
      if (text.length > 120) return false;
      return true;
    });

    const strongCandidate = filtered.find(text =>
      /(시즌\s*\d+|파트\s*\d+|\d+화|S\d+E\d+|Episode\s*\d+)/i.test(text)
    );

    if (strongCandidate) return strongCandidate;
    return "";
  }

  // DisneyPlus 추출기 등록
  window.OTTPlatformBridges.DisneyPlus = {
    extract({ state, video, helpers }) {
      const { parseTimeToSeconds, getShadowElement, cleanText, readBridgeMeta, splitTitle } = helpers;

      const disneyMeta = readBridgeMeta("data-ott-disney-meta");
      const progressBar = document.querySelector("progress-bar");
      const timeRemainingIndicator = document.querySelector("time-remaining-indicator");

      // 1차: shadow DOM 진행바 값 추출
      if (progressBar) {
        const thumb = getShadowElement(progressBar, ".progress-bar__thumb");
        const progressEl = getShadowElement(progressBar, ".progress-bar__progress");

        if (thumb) {
          const now = parseFloat(thumb.getAttribute("aria-valuenow"));
          const max = parseFloat(thumb.getAttribute("aria-valuemax"));

          if (!isNaN(now)) state.extractedCurrentTime = Math.floor(now);
          if (!isNaN(max) && max > 0) state.extractedDuration = Math.floor(max);

          if (!isNaN(now) && !isNaN(max) && max > 0) {
            state.progress = ((now / max) * 100).toFixed(2);
          }
        }

        // thumb 값 실패 시 progress width(%) 사용
        if ((!state.progress || isNaN(parseFloat(state.progress))) && progressEl) {
          const widthPercent = parseFloat(progressEl.style.width);
          if (!isNaN(widthPercent)) {
            state.progress = widthPercent.toFixed(2);
          }
        }
      }

      // 2차: 남은 시간 + 현재시간으로 전체 duration 복원
      if ((!state.extractedDuration || !isFinite(state.extractedDuration)) && timeRemainingIndicator) {
        const remainingTextEl = getShadowElement(timeRemainingIndicator, ".time-remaining-indicator");
        const remainingText = remainingTextEl ? remainingTextEl.textContent.trim() : "";
        const remainingSeconds = parseTimeToSeconds(remainingText);

        if (
          remainingSeconds !== null &&
          state.extractedCurrentTime !== null &&
          isFinite(state.extractedCurrentTime)
        ) {
          state.extractedDuration = Math.floor(state.extractedCurrentTime + remainingSeconds);
        }
      }

      // 3차: video 태그 백업
      if (
        (state.extractedCurrentTime === null || !isFinite(state.extractedCurrentTime)) &&
        video &&
        isFinite(video.currentTime)
      ) {
        state.extractedCurrentTime = Math.floor(video.currentTime);
      }

      if (
        (state.extractedDuration === null || !isFinite(state.extractedDuration) || state.extractedDuration <= 0) &&
        video &&
        isFinite(video.duration) &&
        video.duration > 0
      ) {
        state.extractedDuration = Math.floor(video.duration);
      }

      // 4차: currentTime / duration으로 progress 계산
      if (
        (!state.progress || isNaN(parseFloat(state.progress))) &&
        state.extractedCurrentTime !== null &&
        state.extractedDuration !== null &&
        state.extractedDuration > 0
      ) {
        state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
      }

      // bridge 메타 우선 사용
      if (disneyMeta) {
        if (disneyMeta.title) state.mainTitle = disneyMeta.title;
        if (disneyMeta.subTitle) state.subTitle = disneyMeta.subTitle;

        if (
          (!state.extractedDuration || !isFinite(state.extractedDuration) || state.extractedDuration <= 0) &&
          disneyMeta.runtimeMs
        ) {
          state.extractedDuration = Math.floor(disneyMeta.runtimeMs / 1000);
        }

        // 영화는 fallback 금지
        if (disneyMeta.programType === "movie" && !disneyMeta.subTitle) {
          state.subTitle = "";
        }
      }

      // 제목 fallback
      if (!state.mainTitle) {
        let rawTitle = document.title || "";
        rawTitle = rawTitle
          .replace(/\|\s*디즈니\+\s*$/i, "")
          .replace(/\|\s*Disney\+\s*$/i, "")
          .trim();

        const parsed = splitTitle(rawTitle);

        if (parsed.title) state.mainTitle = parsed.title;
        if (!state.subTitle && parsed.subTitle) state.subTitle = parsed.subTitle;
      }

      // 상세 fallback
      if (!state.subTitle) {
        if (disneyMeta?.programType === "movie") {
          state.subTitle = "";
        } else {
          state.subTitle = extractDisneyPlusSubTitle(document.title || "", state.mainTitle, cleanText);
        }
      }
    },
  };
})();