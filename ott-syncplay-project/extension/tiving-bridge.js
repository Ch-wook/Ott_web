(() => {
  // 중복 설치 방지
  if (window.__OTT_TVING_BRIDGE_INSTALLED__) return;
  window.__OTT_TVING_BRIDGE_INSTALLED__ = true;

  // 플랫폼 bridge 저장소
  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  // 회차 패턴 분리
  // 예:
  // "경도를 기다리며 11회" -> title: "경도를 기다리며", subTitle: "11회"
  // "경도를 기다리며 Ep.11" -> title: "경도를 기다리며", subTitle: "Ep.11"
  function splitTvingEpisodeText(rawText, cleanText) {
    const value = cleanText(rawText);

    if (!value) {
      return {
        title: "",
        subTitle: "",
      };
    }

    const episodePattern = /(시즌\s*\d+.*|[\d]+화|[\d]+회|Ep\.?\s*[\d]+|EP\s*[\d]+|에피소드\s*[\d]+)/i;
    const match = value.match(episodePattern);

    if (match) {
      return {
        title: cleanText(value.replace(episodePattern, "")),
        subTitle: cleanText(match[0]),
      };
    }

    return {
      title: value,
      subTitle: "",
    };
  }

  window.OTTPlatformBridges.Tving = {
    extract({ state, video, helpers }) {
      const { cleanText, splitTitle, getMetaContent } = helpers;

      // 티빙 플레이어 내부 제목 요소 우선
      const programTitleEl =
        document.querySelector(".player-program-title") ||
        document.querySelector(".program-title");

      const episodeTitleEl =
        document.querySelector(".player-episode-title") ||
        document.querySelector(".episode-title");

      // ------------------------------
      // 제목 / 상세 추출
      // ------------------------------

      if (programTitleEl && cleanText(programTitleEl.innerText || programTitleEl.textContent || "") !== "") {
        const rawProgramTitle = cleanText(programTitleEl.innerText || programTitleEl.textContent || "");
        const parsedProgramTitle = splitTvingEpisodeText(rawProgramTitle, cleanText);

        // programTitle 안에 회차가 섞여 있으면 분리
        state.mainTitle = parsedProgramTitle.title || rawProgramTitle;

        // episodeTitleEl 있으면 그걸 우선 subTitle로 사용
        const rawEpisodeTitle = cleanText(episodeTitleEl?.innerText || episodeTitleEl?.textContent || "");

        if (rawEpisodeTitle) {
          state.subTitle = rawEpisodeTitle;
        } else if (parsedProgramTitle.subTitle) {
          state.subTitle = parsedProgramTitle.subTitle;
        }
      } else {
        // 셀렉터 실패 시 브라우저 탭 제목(document.title) / meta 에서 추출 및 분리
        let rawDocTitle =
          document.title ||
          getMetaContent('meta[property="og:title"]') ||
          getMetaContent('meta[name="twitter:title"]') ||
          "";

        rawDocTitle = rawDocTitle
          .replace(/티빙|TVING/gi, "")
          .replace(/\|/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();

        const parsed = splitTvingEpisodeText(rawDocTitle, cleanText);

        if (parsed.title) state.mainTitle = parsed.title;
        if (parsed.subTitle) {
          state.subTitle = parsed.subTitle;
        } else {
          // 그래도 안 나뉘면 공통 splitTitle 한 번 더
          const fallbackParsed = splitTitle(rawDocTitle);
          if (fallbackParsed.title) state.mainTitle = fallbackParsed.title;
          if (fallbackParsed.subTitle) state.subTitle = fallbackParsed.subTitle;
        }
      }

      // ------------------------------
      // 제목 정제
      // ------------------------------

      // "1. 제목" 형태 숫자 번호 제거
      if (state.mainTitle) {
        state.mainTitle = state.mainTitle.replace(/^\d+\.\s*/, "").trim();
      }

      // 끝에 남은 대시 / 공백 제거
      if (state.mainTitle) {
        state.mainTitle = state.mainTitle.replace(/[-\s]+$/, "").trim();
      }

      // ------------------------------
      // 진도 추출
      // ------------------------------

      if (video) {
        if (Number.isFinite(video.currentTime)) {
          state.extractedCurrentTime = Math.floor(video.currentTime);
        }

        if (Number.isFinite(video.duration) && video.duration > 0) {
          state.extractedDuration = Math.floor(video.duration);
        }

        if (
          state.extractedCurrentTime !== null &&
          state.extractedDuration !== null &&
          state.extractedDuration > 0
        ) {
          state.progress = ((state.extractedCurrentTime / state.extractedDuration) * 100).toFixed(2);
        }
      }
    },
  };
})();