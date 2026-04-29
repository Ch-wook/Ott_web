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
