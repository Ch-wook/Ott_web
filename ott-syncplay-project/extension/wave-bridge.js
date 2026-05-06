(() => {
  if (window.__OTT_WAVVE_BRIDGE_INSTALLED__) return;
  window.__OTT_WAVVE_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  window.OTTPlatformBridges.Wavve = {
    extract({ state, helpers }) {
      const { cleanText, getMetaContent, splitTitle } = helpers;

      let rawTitle =
        document.title ||
        getMetaContent('meta[property="og:title"]') ||
        getMetaContent('meta[name="twitter:title"]') ||
        "";

      rawTitle = rawTitle
        .replace(/\|\s*wavve\s*$/i, "")
        .replace(/\|\s*웨이브\s*$/i, "")
        .trim();

      const parsed = splitTitle(rawTitle);

      if (parsed.title) state.mainTitle = parsed.title;
      if (parsed.subTitle) state.subTitle = parsed.subTitle;

      if (!state.mainTitle) {
        const titleEl =
          document.querySelector("h1") ||
          document.querySelector('[data-testid*="title"]') ||
          document.querySelector('[class*="title"]');

        if (titleEl) {
          state.mainTitle = cleanText(titleEl.innerText || titleEl.textContent || "");
        }
      }

      if (!state.subTitle) {
        const subTitleEl =
          document.querySelector('[data-testid*="subtitle"]') ||
          document.querySelector('[class*="subtitle"]') ||
          document.querySelector('[class*="episode"]');

        if (subTitleEl) {
          state.subTitle = cleanText(subTitleEl.innerText || subTitleEl.textContent || "");
        }
      }
    },
  };
})();