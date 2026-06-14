# Google Sheets 연결 설정

현재 투표 페이지는 `config.js`의 `googleAppsScriptUrl` 값이 비어 있으면 브라우저 저장 방식으로 동작합니다.
아래 순서로 Google Apps Script 웹앱 URL을 만든 뒤 `config.js`에 넣으면 모든 응답이 Google Sheet 한 곳에 모입니다.

1. Google Sheets에서 새 스프레드시트를 만듭니다.
   - 추천 이름: `더마크월드 2026년 7월 주주 전략회의 투표 응답`
2. 메뉴에서 `확장 프로그램 > Apps Script`를 엽니다.
3. `google-apps-script/Code.gs` 내용을 Apps Script 편집기에 붙여 넣고 저장합니다.
4. `배포 > 새 배포`를 누릅니다.
5. 유형은 `웹 앱`으로 선택합니다.
6. 실행 권한은 `나`, 액세스 권한은 `모든 사용자`로 설정합니다.
7. 배포 후 발급되는 웹앱 URL을 복사합니다.
8. `config.js`의 `googleAppsScriptUrl`에 그 URL을 넣습니다.

```js
window.PollConfig = {
  googleAppsScriptUrl: "https://script.google.com/macros/s/....../exec",
};
```

설정 후 배포하면 투표 제출과 결과 조회가 Google Sheet를 기준으로 동작합니다.
