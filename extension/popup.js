document.getElementById('extractBtn').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractVideoInfo,
  }, (injectionResults) => {
    const resultDiv = document.getElementById('result');
    
    if (injectionResults && injectionResults[0] && injectionResults[0].result) {
      const data = injectionResults[0].result;
      
      if (!data.error) {
        resultDiv.innerHTML = `<strong>플랫폼:</strong> ${data.platform}<br><strong>제목:</strong> ${data.title}<br><strong>진도율:</strong> ${data.progress !== null ? data.progress + "%" : "확인 불가"}`;
        saveToFile(data);
      } else {
        resultDiv.innerText = data.error;
      }
    } else {
      resultDiv.innerText = "데이터를 가져오지 못했습니다. 페이지를 새로고침 해보세요.";
    }
  });
});

function formatTime(seconds) {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainSeconds = totalSeconds % 60;

  return `${hours}시간 ${minutes}분 ${remainSeconds}초`;
}

function saveToFile(videoData) {
  const content = `플랫폼: ${videoData.platform}
제목: ${videoData.title}
진도율: ${videoData.progress !== null ? videoData.progress + "%" : "확인 불가"}
현재 위치: ${videoData.currentTime ?? "확인 불가"}초
전체 길이: ${videoData.duration ?? "확인 불가"}초
주소: ${videoData.url}
날짜: ${new Date().toLocaleString()}`;

  const blob = new Blob([content], { type: 'text/plain' });

  const reader = new FileReader();
  reader.onloadend = function () {
    const dataUrl = reader.result;
    const safeTitle = videoData.title.replace(/[/\\?%*:|"<>]/g, '-');

    chrome.downloads.download({
      url: dataUrl,
      filename: `${safeTitle}.txt`,
      saveAs: false
    });
  };
  reader.readAsDataURL(blob);
}

function extractVideoInfo() {
  const host = location.hostname;

  let platform = "Unknown";
  if (host.includes("netflix.com")) platform = "Netflix";
  else if (host.includes("disneyplus.com")) platform = "Disney+";
  else if (host.includes("tving.com")) platform = "TVING";
  else if (host.includes("watcha.com")) platform = "Watcha";
  else if (host.includes("wavve.com")) platform = "Wavve";

  function getText(selectors) {
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
    return null;
  }

  let title = null;

  if (platform === "Netflix") {
    title =
      getText([
        '[data-uia="video-title"]',
        '.previewModal--wrapper h3',
        '.previewModal--detailsMetadata h3',
        '.previewModal--boxarttitle',
        '.title-title'
      ]) ||
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title
        .replace(" - 넷플릭스", "")
        .replace(" | Netflix", "")
        .replace(" - Netflix", "")
        .trim();
  } else {
    title =
      getText([
        "h1",
        "h2",
        '[data-testid="title"]'
      ]) ||
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title;
  }

  const video = document.querySelector("video");

  return {
    platform: platform,
    title: title || "알 수 없는 제목",
    progress: video && video.duration > 0
      ? ((video.currentTime / video.duration) * 100).toFixed(2)
      : null,
    currentTime: video ? Math.floor(video.currentTime) : null,
    duration: video ? Math.floor(video.duration) : null,
    url: location.href
  };
}