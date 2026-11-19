/** 빌더 텍스트용 글꼴 — Google Fonts + 시스템 폰트 */

export type BuilderFontOption = {
  label: string;
  value: string;
  group: string;
  /** document.fonts.load / Google CSS용 패밀리명 */
  googleFamily?: string;
};

export const BUILDER_FONT_GROUPS = [
  { id: "sans-ko", label: "한글 · 고딕" },
  { id: "serif-ko", label: "한글 · 명조·바탕" },
  { id: "display-ko", label: "한글 · 포인트·손글씨" },
  { id: "sans-en", label: "영문 · 산세리프" },
  { id: "serif-en", label: "영문 · 세리프" },
  { id: "mono", label: "고정폭" },
  { id: "system", label: "시스템 기본" },
] as const;

export const BUILDER_FONT_OPTIONS: BuilderFontOption[] = [
  {
    label: "Noto Sans KR",
    value: "'Noto Sans KR', sans-serif",
    group: "sans-ko",
    googleFamily: "Noto Sans KR",
  },
  {
    label: "고운 돋움",
    value: "'Gowun Dodum', sans-serif",
    group: "sans-ko",
    googleFamily: "Gowun Dodum",
  },
  {
    label: "Gothic A1",
    value: "'Gothic A1', sans-serif",
    group: "sans-ko",
    googleFamily: "Gothic A1",
  },
  {
    label: "나눔고딕",
    value: "'Nanum Gothic', sans-serif",
    group: "sans-ko",
    googleFamily: "Nanum Gothic",
  },
  {
    label: "맑은 고딕",
    value: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
    group: "system",
  },
  {
    label: "Noto Serif KR",
    value: "'Noto Serif KR', serif",
    group: "serif-ko",
    googleFamily: "Noto Serif KR",
  },
  {
    label: "고운 바탕",
    value: "'Gowun Batang', serif",
    group: "serif-ko",
    googleFamily: "Gowun Batang",
  },
  {
    label: "나눔명조",
    value: "'Nanum Myeongjo', serif",
    group: "serif-ko",
    googleFamily: "Nanum Myeongjo",
  },
  {
    label: "Black Han Sans",
    value: "'Black Han Sans', sans-serif",
    group: "display-ko",
    googleFamily: "Black Han Sans",
  },
  {
    label: "주아 (Jua)",
    value: "Jua, sans-serif",
    group: "display-ko",
    googleFamily: "Jua",
  },
  {
    label: "Do Hyeon",
    value: "'Do Hyeon', sans-serif",
    group: "display-ko",
    googleFamily: "Do Hyeon",
  },
  {
    label: "Hi Melody",
    value: "'Hi Melody', cursive",
    group: "display-ko",
    googleFamily: "Hi Melody",
  },
  {
    label: "Gaegu",
    value: "Gaegu, cursive",
    group: "display-ko",
    googleFamily: "Gaegu",
  },
  {
    label: "Poor Story",
    value: "'Poor Story', cursive",
    group: "display-ko",
    googleFamily: "Poor Story",
  },
  {
    label: "나눔손글씨 펜",
    value: "'Nanum Pen Script', cursive",
    group: "display-ko",
    googleFamily: "Nanum Pen Script",
  },
  {
    label: "Dongle",
    value: "Dongle, cursive",
    group: "display-ko",
    googleFamily: "Dongle",
  },
  {
    label: "Single Day",
    value: "'Single Day', cursive",
    group: "display-ko",
    googleFamily: "Single Day",
  },
  {
    label: "Sunflower",
    value: "Sunflower, sans-serif",
    group: "display-ko",
    googleFamily: "Sunflower",
  },
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
    group: "sans-en",
  },
  {
    label: "Helvetica",
    value: "Helvetica, Arial, sans-serif",
    group: "sans-en",
  },
  {
    label: "Impact",
    value: "Impact, Haettenschweiler, sans-serif",
    group: "sans-en",
  },
  {
    label: "Georgia",
    value: "Georgia, 'Times New Roman', serif",
    group: "serif-en",
  },
  {
    label: "Times New Roman",
    value: "'Times New Roman', Times, serif",
    group: "serif-en",
  },
  {
    label: "Courier New",
    value: "'Courier New', Courier, monospace",
    group: "mono",
  },
];

/** Google Fonts CSS (latin + korean) */
export const BUILDER_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  [
    "Black+Han+Sans",
    "Do+Hyeon",
    "Dongle:wght@400;700",
    "Gaegu",
    "Gothic+A1:wght@400;700",
    "Gowun+Batang",
    "Gowun+Dodum",
    "Hi+Melody",
    "Jua",
    "Nanum+Gothic:wght@400;700;800",
    "Nanum+Myeongjo:wght@400;700",
    "Nanum+Pen+Script",
    "Noto+Sans+KR:wght@400;700;900",
    "Noto+Serif+KR:wght@400;700",
    "Poor+Story",
    "Single+Day",
    "Sunflower:wght@300;500;700",
  ]
    .map((f) => `family=${f}`)
    .join("&") +
  "&display=swap";

export const DEFAULT_BUILDER_FONT = "'Noto Sans KR', sans-serif";

export async function loadBuilderFonts(): Promise<void> {
  if (typeof document === "undefined") return;
  await document.fonts.ready;
  const families = [
    ...new Set(
      BUILDER_FONT_OPTIONS.map((f) => f.googleFamily).filter(Boolean) as string[],
    ),
  ];
  await Promise.all(
    families.map((name) =>
      document.fonts.load(`400 16px "${name}"`).catch(() => undefined),
    ),
  );
}
