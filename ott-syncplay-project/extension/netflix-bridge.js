(() => {
  if (window.__OTT_NETFLIX_BRIDGE_INSTALLED__) return;
  window.__OTT_NETFLIX_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  window.OTTPlatformBridges.Netflix = {
    extract({ state, video, helpers }) {
      const { splitTitle } = helpers;

      // 광고/노란 구간 대응:
      // 재생바 슬라이더 값으로 진도 계산
      const slider = document.querySelector(".scrubber-slider, [role='slider']");
      if (slider) {
        const now = parseFloat(slider.getAttribute("aria-valuenow"));
        const max = parseFloat(slider.getAttribute("aria-valuemax"));

        if (!isNaN(now) && !isNaN(max) && max > 0) {
          // max가 100 이하면 이미 퍼센트 단위
          if (max <= 100) {
            state.progress = now.toFixed(2);
          } else {
            // max가 100보다 크면 초 단위로 판단
            state.progress = ((now / max) * 100).toFixed(2);
            state.extractedCurrentTime = Math.floor(now);
            state.extractedDuration = Math.floor(max);
          }
        }
      }

      // 슬라이더 실패 시 video 태그로 백업
      if ((!state.progress || isNaN(parseFloat(state.progress))) && video && video.duration > 0) {
        state.progress = ((video.currentTime / video.duration) * 100).toFixed(2);
        state.extractedCurrentTime = Math.floor(video.currentTime);
        state.extractedDuration = Math.floor(video.duration);
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

      const parsed = splitTitle(rawTitle);
      if (parsed.title) state.mainTitle = parsed.title;
      if (parsed.subTitle) state.subTitle = parsed.subTitle;
    },
  };
})();