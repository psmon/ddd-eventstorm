# PRD to Event Storming & Example Mapping

PRD(Product Requirement Document)를 Event Storming과 Example Mapping으로 자동 변환하는 AI 기반 웹 애플리케이션입니다.

## 🚀 주요 기능

### 1. Event Storming 자동 생성
- DDD(Domain-Driven Design) 원칙에 따른 자동 분석
- 이벤트, 명령, 액터, 정책, 애그리거트 도출
- Mermaid.js를 통한 다이어그램 시각화 (Pan & Zoom 지원)
- 스티커 노트 형태의 인터랙티브 보드

### 2. 가상 협업자 토론
- 제품 책임자, 개발자, QA, UX 디자이너의 관점에서 토론 시뮬레이션
- 실제 팀 회의처럼 자연스러운 대화 생성

### 3. Example Mapping
- 사용자 스토리, 규칙, 예제, 의문점 자동 도출
- 체계적인 요구사항 정리

## 📋 요구사항

- Node.js 14.0 이상
- OpenAI API Key (GPT-4 사용)

## 🛠️ 설치 방법

### 로컬 설치

1. 저장소 클론
```bash
git clone [repository-url]
cd EventStorming
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 OPENAI_API_KEY 입력
```

4. 서버 실행
```bash
npm start
# 또는 개발 모드
npm run dev
```

5. 브라우저에서 http://localhost:3000 접속

### Docker 설치

1. Docker 이미지 빌드
```bash
docker build -t devtool-registry.lunacode.dev/ddd-event-storming .
```

2. Docker 푸시
```bash
docker push devtool-registry.lunacode.dev/ddd-event-storming
```

3. Docker 컨테이너 실행
```bash
docker run -p 3000:3000 --env-file .env devtool-registry.lunacode.dev/ddd-event-storming
```

## 🎯 사용 방법

1. PRD 내용을 텍스트 영역에 입력
2. "분석하기" 버튼 클릭
3. 생성된 결과 확인:
   - Mermaid 다이어그램 (마우스로 이동/확대 가능)
   - Event Storming 보드 (드래그 가능한 스티커 노트)
   - 가상 협업자 토론
   - Example Mapping 결과

## 📝 샘플 PRD

```
온라인 쇼핑몰 주문 시스템

사용자는 상품을 검색하고 장바구니에 담을 수 있습니다.
장바구니에 담긴 상품들을 한번에 주문할 수 있으며, 주문 시 배송 정보와 결제 정보를 입력해야 합니다.
결제가 완료되면 주문이 확정되고, 사용자에게 주문 확인 이메일이 발송됩니다.
사용자는 주문 내역을 조회하고 주문을 취소할 수 있습니다.
관리자는 주문 상태를 변경할 수 있으며, 배송 정보를 업데이트할 수 있습니다.
```

## 🏗️ 기술 스택

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **AI**: OpenAI GPT-4
- **시각화**: Mermaid.js, Konva.js, Panzoom
- **배포**: Docker

## 📁 프로젝트 구조

```
EventStorming/
├── src/
│   ├── app.js              # Express 서버 메인 파일
│   ├── routes/             # API 라우트
│   ├── services/           # 비즈니스 로직
│   ├── views/              # HTML 템플릿
│   └── public/             # 정적 파일 (CSS, JS)
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

## ⚙️ 환경 변수

`.env` 파일에 다음 설정이 필요합니다:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.