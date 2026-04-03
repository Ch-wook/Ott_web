(() => {
  if (window.__OTT_WATCHA_BRIDGE_INSTALLED__) return;
  window.__OTT_WATCHA_BRIDGE_INSTALLED__ = true;

  window.OTTPlatformBridges = window.OTTPlatformBridges || {};

  window.OTTPlatformBridges.Watcha = {
    extract({ state, helpers }) {
      const { cleanText, getMetaContent, splitTitle } = helpers;

      let rawTitle =
        document.title ||
        getMetaContent('meta[property="og:title"]') ||
        getMetaContent('meta[name="twitter:title"]') ||
        "";

      rawTitle = rawTitle
        .replace(/\|\s*WATCHA\s*$/i, "")
        .replace(/\|\s*왓챠\s*$/i, "")
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