(() => {
  if (window.__OTT_DISNEY_BRIDGE_INSTALLED__) return;
  window.__OTT_DISNEY_BRIDGE_INSTALLED__ = true;

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
      updatedAt: new Date().toISOString()
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
})();