(() => {
  if (window.__OTT_COUPANG_BRIDGE_INSTALLED__) return;
  window.__OTT_COUPANG_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  function isGenericTitle(text) {
    const value = String(text || "").trim();
    return (
      !value ||
      /^쿠팡플레이$/i.test(value) ||
      /^Coupang Play$/i.test(value) ||
      /^CoupangPlay$/i.test(value)
    );
  }

  function isNoiseText(text) {
    const value = String(text || "").trim();

    if (!value) return true;
    if (value.length > 100) return true;

    if (
      /처음부터 보기|좋아 보인다|재생|일시정지|볼륨|음성|자막|해설|HDR|SDR|LIVE|화질|재생 속도|쿠팡플레이|Coupang Play/i.test(value)
    ) {
      return true;
    }

    if (/^\d{1,2}:\d{2}(?::\d{2})?\s*\/\s*\d{1,2}:\d{2}(?::\d{2})?$/.test(value)) {
      return true;
    }

    return false;
  }

  function extractTimePairFromText(text, parseTimeToSeconds) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    const match = clean.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*\/\s*(\d{1,2}:\d{2}(?::\d{2})?)/);

    if (!match) return null;

    const currentSeconds = parseTimeToSeconds(match[1]);
    const durationSeconds = parseTimeToSeconds(match[2]);

    if (
      currentSeconds === null ||
      durationSeconds === null ||
      durationSeconds <= 0 ||
      currentSeconds > durationSeconds
    ) {
      return null;
    }

    return { currentSeconds, durationSeconds };
  }

  // 쿠팡 드라마/예능 회차 패턴 분리
  // 예: "경도를 기다리며: 11회" -> title: "경도를 기다리며", subTitle: "11회"
  function splitCoupangEpisodeTitle(text, cleanText) {
    const value = cleanText(text);

    if (!value) {
      return {
        title: "",
        subTitle: "",
      };
    }

    // 1차: ":" 기준 분리
    if (value.includes(":")) {
      const parts = value.split(":");
      const left = cleanText(parts[0]);
      const right = cleanText(parts.slice(1).join(":"));

      if (left && right) {
        return {
          title: left,
          subTitle: right,
        };
      }
    }

    // 2차: "작품명 11회" 같은 형태 분리
    const match = value.match(/^(.*?)(시즌\s*\d+.*|제\s*\d+\s*화|\d+\s*화|\d+\s*회|S\d+E\d+.*|Episode\s*\d+.*)$/i);
    if (match) {
      return {
        title: cleanText(match[1]),
        subTitle: cleanText(match[2]),
      };
    }

    return {
      title: value,
      subTitle: "",
    };
  }

  window.OTTPlatformBridges.CoupangPlay = {
    extract({ state, video, helpers }) {
      const { cleanText, getMetaContent, splitTitle, parseTimeToSeconds } = helpers;

      // ------------------------------
      // 제목 / 상세 추출
      // ------------------------------

      // 1순위: 쿠팡 실제 플레이어 상단 제목
      const explicitTitleSelectors = [
        ".buttons-top .title",
        ".buttons-top .label",
        ".buttons-top",
        ".back-button .title",
        ".back-button .label",
        ".back-button",
        ".BackButton_backButton___mwDk .title",
        ".BackButton_backButton___mwDk .label",
        ".BackButton_backButton___mwDk",
      ];

      for (const selector of explicitTitleSelectors) {
        const el = document.querySelector(selector);
        const text = cleanText(el?.innerText || el?.textContent || "");

        if (!text || isGenericTitle(text) || isNoiseText(text)) continue;

        const parsed = splitCoupangEpisodeTitle(text, cleanText);

        if (parsed.title && !isGenericTitle(parsed.title)) {
          state.mainTitle = parsed.title;
        }

        if (parsed.subTitle) {
          state.subTitle = parsed.subTitle;
        }

        if (state.mainTitle) break;
      }

      // 2순위: document.title / meta 제목
      if (!state.mainTitle) {
        let rawTitle =
          document.title ||
          getMetaContent('meta[property="og:title"]') ||
          getMetaContent('meta[name="twitter:title"]') ||
          "";

        rawTitle = rawTitle
          .replace(/\|\s*쿠팡플레이\s*$/i, "")
          .replace(/\|\s*Coupang Play\s*$/i, "")
          .trim();

        if (!isGenericTitle(rawTitle)) {
          const parsed = splitCoupangEpisodeTitle(rawTitle, cleanText);

          if (!parsed.subTitle) {
            const commonParsed = splitTitle(rawTitle);
            if (commonParsed.title && !isGenericTitle(commonParsed.title)) {
              state.mainTitle = commonParsed.title;
            }
            if (commonParsed.subTitle) {
              state.subTitle = commonParsed.subTitle;
            }
          } else {
            state.mainTitle = parsed.title;
            state.subTitle = parsed.subTitle;
          }
        }
      }

      // 3순위: subTitle 이 없으면 playback controls 안의 상단 제목에서도 한 번 더 시도
      if (!state.subTitle) {
        const playbackTitleText = cleanText(
          document.querySelector(".buttons-top")?.innerText ||
          document.querySelector(".back-button")?.innerText ||
          ""
        );

        if (playbackTitleText && !isNoiseText(playbackTitleText)) {
          const parsed = splitCoupangEpisodeTitle(playbackTitleText, cleanText);

          if (!state.mainTitle && parsed.title) {
            state.mainTitle = parsed.title;
          }
          if (parsed.subTitle) {
            state.subTitle = parsed.subTitle;
          }
        }
      }

      // ------------------------------
      // 진도 추출
      // ------------------------------

      // 1순위: 쿠팡 플레이어 시간 표시
      const playbackControlEl =
        document.querySelector(".PlaybackControls_playbackControls__m_xvk") ||
        document.querySelector("[class*='PlaybackControls_playbackControls']");

      const timeText = cleanText(playbackControlEl?.innerText || playbackControlEl?.textContent || "");
      const timePairFromControl = extractTimePairFromText(timeText, parseTimeToSeconds);

      if (timePairFromControl) {
        state.extractedCurrentTime = timePairFromControl.currentSeconds;
        state.extractedDuration = timePairFromControl.durationSeconds;
      }

      // 2순위: 화면 전체에서 시간 형식 탐색
      if (
        (state.extractedCurrentTime === null || state.extractedDuration === null) &&
        !timePairFromControl
      ) {
        const nodes = [...document.querySelectorAll("div, span, p")];

        for (const el of nodes) {
          const text = cleanText(el.innerText || el.textContent || "");
          const parsed = extractTimePairFromText(text, parseTimeToSeconds);

          if (parsed) {
            state.extractedCurrentTime = parsed.currentSeconds;
            state.extractedDuration = parsed.durationSeconds;
            break;
          }
        }
      }

      // 3순위: video 태그 백업
      if (
        (state.extractedCurrentTime === null || !Number.isFinite(state.extractedCurrentTime)) &&
        video &&
        Number.isFinite(video.currentTime)
      ) {
        state.extractedCurrentTime = Math.floor(video.currentTime);
      }

      if (
        (state.extractedDuration === null || !Number.isFinite(state.extractedDuration) || state.extractedDuration <= 0) &&
        video &&
        Number.isFinite(video.duration) &&
        video.duration > 0
      ) {
        state.extractedDuration = Math.floor(video.duration);
      }

      // 쿠팡은 다른 슬라이더를 잘못 물 수 있어서 마지막에 강제 재계산
      if (
        state.extractedCurrentTime !== null &&
        state.extractedDuration !== null &&
        state.extractedDuration > 0
      ) {
        state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
      }

      if (isGenericTitle(state.mainTitle)) {
        state.mainTitle = "";
      }
    },
  };
})();