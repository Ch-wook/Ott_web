# ott-syncplay-project

OTT 시청 기록을 통합 관리하기 위한 프로젝트입니다.

## 프로젝트 소개
사용자가 OTT 플랫폼에서 시청 중인 콘텐츠 정보를 추출하고,
이를 한곳에서 확인하고 관리할 수 있도록 만드는 것을 목표로 합니다.

현재 저장소에는 크롬 확장프로그램 기능이 포함되어 있으며,
추후 프론트엔드 대시보드와 백엔드 서버를 연동하여
시청 기록을 더욱 편리하게 관리할 수 있도록 확장할 예정입니다.

## 현재 구현 내용
- 크롬 확장프로그램 기반 OTT 페이지 정보 추출
- 현재 콘텐츠 제목 확인
- 시청 진행률 확인
- 팝업 창에서 추출 결과 확인

## 폴더 구조
```bash
ott-syncplay-project/
├─ extension/
|  ├─ README.md
|  ├─ manifest.json
|  ├─ popup.html
|  ├─ popup.js
|  └─disney-bridge.js
└─ README.md


### **1. App.jsx 수정 (검색 메뉴 및 페이지 연결)**
[App.jsx](file:///d:/병합작업/main_project/syncplay-dashboard/src/App.jsx) 파일에서는 사이드바 아이콘 추가와 라우팅(경로 설정)을 해줘야 합니다.

- **Import 추가 (파일 상단)**:
```javascript
import GlobalSearchPage from './pages/GlobalSearchPage';
```

- **사이드바 메뉴 추가 (Link 태그 부분)**:
```javascript
<Link title="Search" to="/search" className={`p-3 rounded-xl transition-colors ${location.pathname === '/search' ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}>
  <Search size={24} />
</Link>
```

- **페이지 제목 로직 수정 (h1 태그 내부)**:
```javascript
{location.pathname === '/movies' ? 'Movies' : 
 location.pathname === '/search' ? 'Global Search' : // 이 줄 추가
 location.pathname === '/tv' ? 'TV Shows' : 
 location.pathname === '/mypage' ? 'My Page' : 'Settings'}
```

- **라우팅 추가 (Routes 태그 내부)**:
```javascript
<Route path="/search" element={<GlobalSearchPage />} />
```

---

### **2. manifest.json 수정 (다양한 OTT 사이트 대응)**
[manifest.json](file:///d:/병합작업/main_project/extension/manifest.json) 파일의 `content_scripts` 섹션에 새로 추가된 브릿지 파일들과 해당 OTT 사이트 주소를 연결해줘야 합니다.

`content_scripts` 배열 안에 아래 내용을 추가하면 됩니다:

```json
"content_scripts": [
  {
    "matches": ["https://www.disneyplus.com/*"],
    "js": ["disney-bridge.js"],
    "run_at": "document_start",
    "world": "MAIN"
  },
  {
    "matches": ["https://www.netflix.com/*"],
    "js": ["netflix-bridge.js"],
    "run_at": "document_start",
    "world": "MAIN"
  },
  {
    "matches": ["https://www.tiving.com/*"],
    "js": ["tiving-bridge.js"],
    "run_at": "document_start",
    "world": "MAIN"
  },
  {
    "matches": ["https://www.wavve.com/*"],
    "js": ["wave-bridge.js"],
    "run_at": "document_start",
    "world": "MAIN"
  },
  {
    "matches": ["https://www.watcha.com/*"],
    "js": ["watcha-bridge.js"],
    "run_at": "document_start",
    "world": "MAIN"
  },
  {
    "matches": ["https://www.coupangplay.com/*"],
    "js": ["coupang-bridge.js"],
    "run_at": "document_start",
    "world": "MAIN"
  }
]


### **1. 백엔드 (syncplay-server) 추가 및 수정**
서버 측에서 TMDB API와 통신하고 데이터를 처리하는 로직을 가져와야 합니다.

- **새로 추가해야 할 파일**:
    - `src/main/java/com/syncplay/server/TmdbSearchController.java`: TMDB 검색 API 엔드포인트입니다.
    - `src/main/java/com/syncplay/server/TmdbSearchService.java`: 실제 검색 및 내 구독 플랫폼과 매칭하는 비즈니스 로직이 들어있습니다.
- **수정해야 할 파일**:
    - `src/main/resources/application.properties`: TMDB API 호출을 위한 `tmdb.access-token` 설정을 추가해야 합니다.

### **2. 프론트엔드 (syncplay-dashboard) 추가 및 수정**
사용자 화면에서 검색창과 추천 목록을 보여주는 부분입니다.

- **새로 추가해야 할 파일**:
    - `src/pages/GlobalSearchPage.jsx`: 검색 및 맞춤형 추천이 표시되는 전체 페이지입니다.
    - `src/hooks/useTmdbSearch.js`: 서버의 TMDB API를 호출하는 커스텀 Hook입니다.
- **수정해야 할 파일**:
    - `src/App.jsx`: 사이드바에 '검색(Search)' 메뉴를 추가하고, `/search` 경로로 들어왔을 때 `GlobalSearchPage`를 보여주도록 라우팅 설정을 업데이트해야 합니다.

### **3. 브라우저 확장 프로그램 (extension) 통합**
`ott_web`에는 넷플릭스, 티빙, 웨이브 등 더 많은 OTT 플랫폼을 지원하는 브릿지 파일들이 들어있습니다.

- **추가해야 할 파일들**:
    - `ott-syncplay-project/extension/` 폴더 내의 모든 `*-bridge.js` 파일들 (netflix, tiving, wave, watcha, coupang 등).
    - `manifest.json`: 새로 추가된 브릿지 파일들이 각 OTT 사이트에서 동작하도록 `content_scripts` 설정을 업데이트해야 합니다.

---
