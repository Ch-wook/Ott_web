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
