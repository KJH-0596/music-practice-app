# 🎸 Music Practice App

실용음악 취미생부터 전공생까지 사용할 수 있는 기타/베이스 연습 웹앱입니다.

## 현재 기능

### 메트로놈
- **BPM 조절** — 숫자에 마우스를 올리고 스크롤로 조절 (1단위 / Shift+스크롤 10단위)
- **박자 선택** — 2/4, 3/4, 4/4, 6/8 지원
- **강박/약박 구분** 사운드
- **Tap Tempo** — Tap 버튼을 리듬에 맞춰 클릭하면 BPM 자동 계산
- **비트 인디케이터** — 현재 박자 위치 시각화
- **스페이스바** 단축키로 재생/정지

## 권장 사용 환경

오디오 인터페이스(오인페)를 사용하는 환경에 최적화되어 있습니다.

```
[기타/베이스] → [오디오 인터페이스] → 직접 모니터링 (레이턴시 없음)
[브라우저 메트로놈 소리] → [오디오 인터페이스] → 모니터/헤드폰
```

## 시작하기

### 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/music-practice-app.git
cd music-practice-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 확인합니다.

### 빌드 (정적 사이트 배포용)

```bash
npm run build
# out/ 폴더에 정적 파일이 생성됩니다
```

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Static Export) |
| 언어 | TypeScript |
| 오디오 엔진 | Tone.js 15 |
| 상태 관리 | Zustand 5 |
| 스타일링 | Tailwind CSS 4 |

## 프로젝트 구조

```
├── core/audio/         # UI와 독립된 오디오 엔진
│   ├── engine.ts       # AudioContext 초기화 및 Tone.js 캐싱
│   └── metronome.ts    # Transport + Sequence 기반 메트로놈 로직
├── store/
│   └── useStore.ts     # Zustand 전역 상태 (BPM, 박자, 재생 여부)
├── hooks/
│   └── useMetronome.ts # React ↔ Core 브릿지 (Tap Tempo, 단축키 포함)
├── components/
│   ├── BpmControl.tsx              # 스크롤 BPM 조절 + 템포 이름 표시
│   ├── TimeSignatureSelector.tsx   # 박자 선택 버튼
│   ├── BeatIndicator.tsx           # 현재 박자 시각화
│   └── TransportControl.tsx        # 재생/정지, Tap Tempo
└── types/
    └── audio.ts        # TimeSignature, BPM 상수 타입 정의
```

## 로드맵

- [ ] 세분음표 (Subdivision) — 8분음표, 16분음표, 셋잇단음표
- [ ] 사운드 선택 — 클릭, 카우벨, 드럼 킥
- [ ] 연습 모드 — BPM 자동 증가
- [ ] 기타 지판 (Fretboard) 스케일 시각화
- [ ] 크로매틱 튜너 (오인페 입력 기반)

## 라이선스

MIT
