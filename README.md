# 김항철 academy — 학원 스케줄 앱 (PWA)

학원 관리자·강사·학부모·학생이 수업 일정, 공지, 일정 변경 요청을 한 곳에서 다루는 설치형 웹앱입니다.
기획: `../기획서.md`, 구현 계획: `../구현계획.md`

- 화면: React + Vite (PWA)
- 로그인·데이터: Firebase Authentication(Google) + Firestore
- 배포: GitHub Pages (GitHub Actions)

## 처음 설정

1. **Firebase 프로젝트 만들기** (Spark 무료 요금제로 충분)
   - Authentication → 로그인 방법 → **Google** 사용 설정
   - Firestore Database 만들기 (지역: `asia-northeast3` 서울 권장)
   - 프로젝트 설정 → 내 앱 → 웹 앱 추가 → 설정값 복사
2. **로컬 설정**: `.env.example`을 `.env.local`로 복사하고 값 채우기
3. **보안 규칙·인덱스 올리기**
   ```
   npx firebase login
   npx firebase use --add        # 만든 프로젝트 선택
   npx firebase deploy --only firestore
   ```
4. **첫 관리자 만들기** (한 번만, Firebase 콘솔에서 직접)
   - 앱에 Google로 한 번 로그인한다 (전화번호 화면이 나오면 멈춘다)
   - 콘솔 → Authentication → 사용자에서 내 **UID** 복사
   - Firestore → `users` 컬렉션 → 문서 ID = UID, 필드:
     `academyId: "main"`, `role: "admin"`, `name: "원장"`, `phone: "010..."`,
     `studentIds: []`(배열), `classIds: []`(배열)
   - 새로고침하면 관리 탭이 보인다. 이후 구성원은 앱의 **관리 → 구성원**에서 전화번호로 등록한다.

## GitHub Pages 배포

1. 이 `app` 폴더를 GitHub 저장소로 올린다 (`main` 브랜치)
2. 저장소 Settings → Pages → Source: **GitHub Actions**
3. Settings → Secrets and variables → Actions → **Variables**에 추가:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
   (Firebase 웹 설정값은 공개되어도 되는 값입니다. 데이터 보호는 보안 규칙이 합니다.)
4. Firebase 콘솔 → Authentication → 설정 → **승인된 도메인**에 `<github-id>.github.io` 추가
5. `main`에 push하면 테스트 → 빌드 → 배포가 자동으로 돈다.
   주소: `https://<github-id>.github.io/<저장소명>/`

> private 저장소는 GitHub 요금제에 따라 Pages를 못 쓸 수 있습니다. 확인 후 진행하세요.

## 개발

```
npm install
npm run dev          # http://localhost:5173 (.env.local 없으면 에뮬레이터에 연결)
npm test             # 단위·화면 테스트
npm run test:emu     # 보안 규칙·저장소 테스트 (Java 필요: Firebase 에뮬레이터)
```

## 운영 메모

- 학년은 저장하지 않고 생년으로 계산합니다 (매년 1월 1일 기준, 학년 = 올해 − 생년 − 6).
- 그룹 학년 범위를 0으로 두면 "수동 지정 전용" 그룹이 됩니다 (예: 특목반).
- 변경 요청은 접수 후 7일이 지나면 관리자 화면에 "7일 초과" 배지가 붙습니다 (서버 알림 없음).
- 학생의 수강 반을 바꾸면 그 학부모를 **관리 → 구성원 → 수정 → 저장**해야 학부모가 볼 수 있는 반이 갱신됩니다.
- 대상 지정 공지(그룹·반·학생)는 화면에서 걸러 보여 줍니다. 같은 학원 구성원은 기술적으로 읽을 수 있으니 민감한 내용은 쓰지 마세요.
- Spark 무료 한도: Firestore 읽기 하루 5만, 쓰기 2만. 넘으면 다음 날까지 멈춥니다.
