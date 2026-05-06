#  OTT SyncPlay Project
**여러 OTT 플랫폼의 시청 기록을 한곳에서 통합 관리하는 스마트 대시보드 시스템**

##  프로젝트 소개
**OTT SyncPlay**는 사용자가 이용 중인 다양한 OTT(Netflix, TVING, Disney+, Wavve 등)의 시청 정보를 크롬 확장 프로그램을 통해 실시간으로 추출하고, 이를 전용 리액트 대시보드에서 통합 관리할 수 있는 서비스입니다.

단순히 기록을 나열하는 것을 넘어, **TMDB API를 활용한 실시간 포스터 연동**과 **로컬 로고 자산 관리 시스템**을 통해 사용자에게 상용 서비스 수준의 UI/UX를 제공하는 것을 목표로 합니다.

##  주요 기능

### 1. 시청 기록 통합 대시보드 (React)
* **최근 시청 기록**: 실시간으로 업데이트되는 시청 콘텐츠의 제목, 에피소드, 진행률 확인.
* **포스터 자동 매핑**: 콘텐츠 제목을 기반으로 **TMDB API**와 연동하여 고화질 포스터 출력.
* **OTT 가시성 개선**: 각 플랫폼별 공식 로고를 로컬(public) 자산으로 관리하여 가독성 및 디자인 통일성 확보.
* **찜 목록(Wishlist)**: 보고 싶은 콘텐츠를 별도로 저장하고 관리하는 기능.

### 2. 크롬 확장 프로그램 (Extension)
* **실시간 데이터 추출**: 각 OTT 재생 페이지(넷플릭스, 티빙 등)에서 제목, 진행률, URL 자동 감지.
* **백엔드 자동 전송**: 추출된 시청 데이터를 백엔드 API 서버로 실시간 전송 및 동기화.

### 3. 백엔드 서버 (Spring Boot)
* **RESTful API**: 시청 히스토리, 구독 정보, 찜 목록 관리를 위한 엔드포인트 제공.
* **동적 데이터 처리**: 확장 프로그램으로부터 오는 실시간 페이로드를 처리하고 저장하는 로직 구현.

## 🛠 기술 스택
* **Frontend**: React, Tailwind CSS, Lucide React (Icons), Vite
* **Backend**: Java Spring Boot, Gradle
* **Extension**: JavaScript, Chrome Extension API
* **External API**: TMDB API (The Movie Database)

## 📂 프로젝트 구조 (Project Structure)
```bash
WebProject1/
├─ extension/ (Chrome Extension)
│  ├─ manifest.json         # 확장 프로그램 설정 및 권한
│  ├─ popup.html / popup.js # 확장 프로그램 팝업 UI 및 데이터 전송 로직
│  ├─ netflix-bridge.js     # 넷플릭스 시청 데이터 추출 스크립트
│  ├─ tving-bridge.js       # 티빙 시청 데이터 추출 스크립트
│  ├─ disney-bridge.js      # 디즈니+ 시청 데이터 추출 스크립트
│  ├─ coupang-bridge.js     # 쿠팡플레이 시청 데이터 추출 스크립트
│  ├─ watcha-bridge.js      # 왓챠 시청 데이터 추출 스크립트
│  └─ wave-bridge.js        # 웨이브 시청 데이터 추출 스크립트
├─ syncplay-dashboard/ (React Frontend)
│  ├─ public/logos/         # OTT별 고화질 로컬 로고 자산 (PNG/SVG)
│  ├─ src/
│  │  ├─ components/
│  │  │  └─ MediaCard.jsx   # 포스터 및 OTT 로고가 포함된 공통 카드 컴포넌트
│  │  ├─ pages/
│  │  │  ├─ MyPage.jsx      # 사용자 메인 대시보드 (최근 시청 기록 포함)
│  │  │  ├─ MoviesPage.jsx   # 영화 카테고리 시청 기록 관리
│  │  │  ├─ TvShowsPage.jsx  # TV 쇼 카테고리 시청 기록 관리
│  │  │  └─ SearchPage.jsx   # 통합 콘텐츠 검색 페이지
│  │  ├─ App.jsx            # 라우팅 및 전역 상태 관리
│  │  └─ main.jsx           # React 엔트리 포인트
├─ syncplay-server/ (Spring Boot Backend)
│  ├─ src/main/java/com/syncplay/server/
│  │  ├─ Application.java                # 스프링부트 메인 어플리케이션
│  │  ├─ HistoryController.java          # 시청 기록(History) 저장 및 조회 API
│  │  ├─ UserSubscriptionController.java  # 사용자의 구독 플랫폼 관리 API
│  │  ├─ WishlistController.java          # 찜 목록(Wishlist) 관리 API
│  │  ├─ ProviderAvailabilityService.java # OTT 플랫폼 가용성 체크 로직
│  │  ├─ WatchHistory.java               # 시청 기록 데이터 모델 (DTO)
│  │  └─ WebConfig.java                  # CORS 설정 및 보안 환경 설정
│  └─ src/main/resources/
│     └─ application.properties          # 서버 포트 및 환경 설정
└─ README.md