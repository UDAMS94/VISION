/* =========================================================
 * 사이트 설정 & 강의 데이터
 * ---------------------------------------------------------
 * 이 파일만 수정하면 사이트 내용이 바뀝니다.
 *  - YouTube 영상 ID: https://www.youtube.com/watch?v=XXXXXXXXXXX 의 XXXXXXXXXXX 부분
 *  - videoId 가 비어 있으면 "영상 준비 중" 화면이 표시됩니다.
 * ========================================================= */

window.SITE = {
  name: "VISION 클래스",
  tagline: "매일 조금씩, 확실하게 달라지는 나",
  description:
    "21일, 66일, 100일. 정해진 기간 동안 매일 한 강씩 따라오면 습관이 되고, 습관이 삶을 바꿉니다.",
  instructor: {
    name: "강사 이름",
    role: "VISION 클래스 대표 강사",
    bio: "여기에 강사 소개를 적어주세요. 어떤 경험을 했고, 왜 이 강의를 만들었는지 이야기하면 수강생의 신뢰가 높아집니다.",
    avatar: "", // 이미지 경로 (예: "assets/instructor.jpg"). 비우면 이니셜 표시
  },
  youtube: {
    channelUrl: "https://www.youtube.com/", // 내 채널 주소로 바꿔주세요
    // 홈 화면 "유튜브" 섹션에 노출될 영상
    featured: [
      { id: "", title: "채널 대표 영상 제목 1" },
      { id: "", title: "채널 대표 영상 제목 2" },
      { id: "", title: "채널 대표 영상 제목 3" },
    ],
  },
  contact: {
    email: "hello@example.com",
    kakao: "", // 카카오톡 채널 링크 (선택)
  },
  /*
   * 강의 잠금 방식
   *  - "sequential": 이전 강의를 완료해야 다음 강의가 열림
   *  - "daily"     : 수강 시작일 기준 하루에 한 강씩 열림
   *  - "all"       : 전부 열림
   */
  unlockMode: "sequential",
};

window.COURSES = [
  {
    id: "21",
    days: 21,
    badge: "입문",
    title: "21일 시작 챌린지",
    subtitle: "작은 습관 하나를 내 것으로 만드는 3주",
    color: "#ff6b3d",
    price: "₩49,000",
    description:
      "처음 시작하는 분을 위한 과정입니다. 하루 10~15분, 3주 동안 하나의 습관을 정하고 매일 실천하며 기록합니다.",
    outcomes: [
      "나에게 맞는 핵심 습관 1개 설정",
      "매일 실천을 이어가는 루틴 설계",
      "21일 실천 기록과 회고",
    ],
    phases: [
      { title: "1주차 · 시작하기", from: 1, to: 7 },
      { title: "2주차 · 이어가기", from: 8, to: 14 },
      { title: "3주차 · 굳히기", from: 15, to: 21 },
    ],
    // 일차별 강의 내용 (적지 않은 일차는 자동으로 기본 제목이 붙습니다)
    lessons: {
      1: { title: "오리엔테이션: 왜 21일인가", videoId: "", duration: "12:00", mission: "내가 바꾸고 싶은 것 3가지 적기" },
      2: { title: "나의 현재 상태 점검하기", videoId: "", duration: "10:00", mission: "하루 일과를 시간대별로 기록하기" },
      3: { title: "핵심 습관 하나 고르기", videoId: "", duration: "11:00", mission: "21일 동안 실천할 습관 1개 정하기" },
    },
  },
  {
    id: "66",
    days: 66,
    badge: "중급",
    title: "66일 습관 완성 과정",
    subtitle: "의지가 아니라 시스템으로 움직이는 나",
    color: "#3d7bff",
    price: "₩129,000",
    description:
      "21일 챌린지를 넘어, 습관이 자연스럽게 몸에 붙을 때까지 이어가는 과정입니다. 단계별로 목표를 확장하고 흔들릴 때 다시 돌아오는 법을 배웁니다.",
    outcomes: [
      "습관을 유지하는 나만의 시스템 구축",
      "슬럼프와 공백을 회복하는 방법",
      "두 번째, 세 번째 습관으로 확장",
    ],
    phases: [
      { title: "1단계 · 기초 다지기", from: 1, to: 22 },
      { title: "2단계 · 시스템 만들기", from: 23, to: 44 },
      { title: "3단계 · 자동화하기", from: 45, to: 66 },
    ],
    lessons: {
      1: { title: "오리엔테이션: 66일의 여정", videoId: "", duration: "15:00", mission: "66일 후의 나에게 편지 쓰기" },
    },
  },
  {
    id: "100",
    days: 100,
    badge: "심화",
    title: "100일 변화 프로젝트",
    subtitle: "100일 뒤, 완전히 다른 기준으로 사는 나",
    color: "#8b5cf6",
    price: "₩249,000",
    description:
      "가장 깊이 있는 과정입니다. 100일 동안 생각·감정·행동을 함께 다루며, 삶의 기준 자체를 다시 세웁니다.",
    outcomes: [
      "100일 동안의 체계적인 성장 로드맵",
      "생각·감정·행동을 함께 다루는 훈련",
      "과정 종료 후에도 이어지는 자기관리 체계",
    ],
    phases: [
      { title: "1부 · 나를 알기", from: 1, to: 25 },
      { title: "2부 · 기준 세우기", from: 26, to: 50 },
      { title: "3부 · 행동 바꾸기", from: 51, to: 75 },
      { title: "4부 · 삶에 녹이기", from: 76, to: 100 },
    ],
    lessons: {
      1: { title: "오리엔테이션: 100일 프로젝트 안내", videoId: "", duration: "18:00", mission: "100일 목표 선언문 작성하기" },
    },
  },
];
