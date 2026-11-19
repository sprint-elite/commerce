import type { ContentArticle, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GUIDE_ARTICLES } from "@/lib/guide-articles";
import type {
  GuideArticle,
  GuideFaq,
  GuideSection,
} from "@/lib/guide-articles";
import {
  articlePath,
  parseContentArticleType,
  type ContentArticleType,
} from "@/lib/content-article-types";

export type { ContentArticleType } from "@/lib/content-article-types";
export { articlePath, parseContentArticleType };

export type ContentArticlePayload = {
  type: ContentArticleType;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  intro: string[];
  sections: GuideSection[];
  faq: GuideFaq[];
  coverImageUrl?: string | null;
  cardTag?: string | null;
  cardGradient?: string | null;
  sortOrder?: number;
};

export type HomeContentCard = {
  id: string;
  type: ContentArticleType;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  cardTag: string | null;
  gradient: string;
};

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter((s) => s.trim().length > 0);
}

function asSections(raw: unknown): GuideSection[] {
  if (!Array.isArray(raw)) return [];
  const out: GuideSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? "").trim();
    if (!title) continue;
    const body = asStringArray(r.body);
    const tips = asStringArray(r.tips);
    const products: { slug: string; caption?: string }[] = [];
    if (Array.isArray(r.products)) {
      for (const p of r.products) {
        if (!p || typeof p !== "object") continue;
        const pr = p as { slug?: unknown; caption?: unknown };
        const slug = String(pr.slug ?? "").trim();
        if (!slug) continue;
        products.push({
          slug,
          caption: typeof pr.caption === "string" ? pr.caption : undefined,
        });
      }
    }
    out.push({
      title,
      body,
      tipsTitle: typeof r.tipsTitle === "string" ? r.tipsTitle : undefined,
      tips: tips.length ? tips : undefined,
      productsTitle:
        typeof r.productsTitle === "string" ? r.productsTitle : undefined,
      products: products.length ? products : undefined,
    });
  }
  return out;
}

function asFaq(raw: unknown): GuideFaq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as { q?: unknown; a?: unknown };
      const q = String(r.q ?? "").trim();
      const a = String(r.a ?? "").trim();
      if (!q || !a) return null;
      return { q, a };
    })
    .filter((x): x is GuideFaq => x != null);
}

export function rowToArticle(row: ContentArticle): GuideArticle & {
  type: ContentArticleType;
  coverImageUrl: string | null;
  cardTag: string | null;
} {
  const type = parseContentArticleType(row.type);
  return {
    type,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    date: row.publishedAt.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    intro: asStringArray(row.introJson),
    sections: asSections(row.sectionsJson),
    faq: asFaq(row.faqJson),
    cardGradient: row.cardGradient ?? "from-zinc-100 to-stone-50",
    coverImageUrl: row.coverImageUrl,
    cardTag: row.cardTag,
  };
}

export async function fetchContentArticleBySlug(
  type: ContentArticleType,
  slug: string,
) {
  const row = await prisma.contentArticle.findFirst({
    where: { type, slug, isActive: true },
  });
  return row ? rowToArticle(row) : null;
}

export async function fetchHomeContentCards(
  type: ContentArticleType,
): Promise<HomeContentCard[]> {
  const rows = await prisma.contentArticle.findMany({
    where: { type, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    type,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    href: articlePath(type, row.slug),
    imageUrl: row.coverImageUrl,
    cardTag: row.cardTag,
    gradient: row.cardGradient ?? "from-zinc-100 to-stone-50",
  }));
}

/** 소개글 우측 추천 (현재 글 제외) */
export async function fetchRelatedIdeaCards(
  excludeSlug: string,
  take = 3,
): Promise<HomeContentCard[]> {
  const rows = await prisma.contentArticle.findMany({
    where: {
      type: "IDEA",
      isActive: true,
      slug: { not: excludeSlug },
    },
    orderBy: { sortOrder: "asc" },
    take,
  });
  return rows.map((row) => ({
    id: row.id,
    type: "IDEA" as const,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    href: articlePath("IDEA", row.slug),
    imageUrl: row.coverImageUrl,
    cardTag: row.cardTag,
    gradient: row.cardGradient ?? "from-zinc-100 to-stone-50",
  }));
}

export const DEFAULT_IDEA_ARTICLES: ContentArticlePayload[] = [
  {
    type: "IDEA",
    slug: "couple-ecobag",
    title: "커플 에코백",
    subtitle: "우정 · 커플 굿즈",
    date: "2026.08.20",
    coverImageUrl: "/images/couple_ecobag.png",
    cardTag: null,
    cardGradient: "from-pink-200 to-rose-100",
    sortOrder: 0,
    intro: [
      "둘만의 문구·날짜·이니셜을 넣은 에코백은 기념일·우정·커플 여행 선물로 꾸준히 사랑받는 아이템입니다. 시중에서 같은 디자인을 찾기 어렵고, 1~2개만 맞춰도 ‘우리만의 굿즈’가 된다는 점이 가장 큰 매력이에요.",
      "JH MAKER에서는 같은 시안을 색만 다르게 맞추거나, 앞면은 공통 그래픽·뒷면은 각자 문구로 나눠 제작할 수 있습니다. 디자인 경험이 없어도 짧은 한 줄과 이니셜만으로 충분히 완성도 있는 결과가 나옵니다.",
      "아래에서는 스타일 선택, 문구 아이디어, 세트 연출 팁과 FAQ를 정리했습니다. 읽고 바로 빌더에서 두 장을 만들어 보세요.",
    ],
    sections: [
      {
        title: "어떤 스타일이 잘 맞을까요?",
        body: [
          "데일리로 오래 쓸 생각이면 사각·라운드가 안정적입니다. 수납력이 있고 형태가 정돈되어 보이며, 커플이 같은 상품을 고르면 거리에서도 세트감이 분명해집니다.",
          "가벼운 소풍·페스티벌용으로는 미니·크로스가 편합니다. 손을 자유롭게 쓰고 싶을 때 크로스 스트랩이 특히 좋고, 미니는 기념일 소량 선물·답례용으로도 부담이 적습니다.",
          "처음이라면 ‘같은 상품 2개 + 컬러만 다르게’ 조합을 추천합니다. 디자인 작업량이 줄고, 사진으로 남겼을 때 가장 예쁜 연출이 나옵니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag", caption: "사각 기본" },
          { slug: "ecobag-round", caption: "라운드" },
          { slug: "ecobag-mini", caption: "미니 세트" },
          { slug: "ecobag-cross", caption: "크로스" },
        ],
      },
      {
        title: "문구·레이아웃 아이디어",
        body: [
          "인쇄에 잘 어울리는 문구는 짧은 한 줄입니다. 이니셜, 만난 날짜(YYYY.MM.DD), ‘항상 같이’, ‘our day’, 서로의 닉네임처럼 의미가 분명하고 글자 수가 적은 조합이 선명합니다.",
          "앞면에는 공통 심볼·하트·별자리 등 그래픽, 뒷면에는 각자 이름·짧은 메시지를 넣으면 개성과 통일감을 동시에 살릴 수 있어요. 폰트는 2종류 이하로 통일하고, 원단 색과 대비가 강한 잉크 컬러를 고르세요.",
          "긴 편지 문장·작은 필기체는 실제 인쇄에서 읽기 어려울 수 있습니다. 하고 싶은 말이 길다면 QR이나 작은 날짜만 넣고, 편지는 별도 카드로 전하는 편이 낫습니다.",
        ],
        tipsTitle: "디자인 팁",
        tips: [
          "폰트는 2종류 이하로 통일하세요.",
          "색 대비가 강한 조합이 더 선명합니다.",
          "중요 문구는 가이드 박스 중앙에 두세요.",
          "시안을 저장해 두고 기념일마다 날짜만 바꿔 재주문하세요.",
        ],
        productsTitle: "바로 만들기",
        products: [{ slug: "ecobag", caption: "빌더로 시작" }],
      },
      {
        title: "선물·사진 연출 팁",
        body: [
          "포장할 때는 두 가방을 겹쳐 리본으로 묶거나, 작은 파우치에 메시지 카드를 넣어 세트로 주면 완성도가 올라갑니다. 여행·피크닉 인증샷에는 같은 각도에서 나란히 두는 구도가 잘 맞아요.",
          "우정 기념·졸업·수능 응원처럼 ‘둘’이 아닌 ‘여럿’이면 미니 에코백을 같은 시안으로 맞춰 배포하는 구성도 인기입니다.",
        ],
        productsTitle: "세트에 더하기",
        products: [
          { slug: "pouch-flat", caption: "카드·소품 파우치" },
          { slug: "ecobag-mini", caption: "친구들 배포용" },
        ],
      },
    ],
    faq: [
      {
        q: "2개만 주문해도 되나요?",
        a: "네. 커스텀 에코백은 1개부터 제작할 수 있어 커플·우정용 소량 제작에 적합합니다.",
      },
      {
        q: "서로 다른 문구로 만들 수 있나요?",
        a: "가능합니다. 같은 상품으로 시안을 두 번 저장하거나, 앞·뒷면 역할을 나눠 각각 주문하면 됩니다.",
      },
      {
        q: "사진도 넣을 수 있나요?",
        a: "고해상도 원본이면 가능합니다. 다만 초상권·개인정보가 있는 이미지는 본인 동의 하에 사용해 주세요.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "home-deco",
    title: "집꾸미기",
    subtitle: "파우치 · 수납",
    date: "2026.08.18",
    coverImageUrl: "/images/house.png",
    cardGradient: "from-amber-200 to-orange-100",
    sortOrder: 1,
    intro: [
      "현관·화장대·서랍·거실 테이블처럼 ‘자주 보이는 자리’에 두는 파우치에 집 이름, 짧은 슬로건, 패밀리 이니셜을 넣으면 수납이 곧 인테리어가 됩니다. 기성 수납함과 달리 색·문구를 내 공간 톤에 맞출 수 있어요.",
      "JH MAKER 파우치는 1개부터 제작 가능해, 방마다 다른 라벨(충전기 / 케이블 / 구급)을 붙여 시리즈로 맞추기 좋습니다. 선물용 집들이 답례로도 부담 없는 단가대입니다.",
      "아래에서는 공간별 추천 형태, 라벨 문구 예시, 세트 구성 팁을 정리했습니다.",
    ],
    sections: [
      {
        title: "집 안 어디에 두나요?",
        body: [
          "플랫 파우치는 서류·여권·충전기처럼 납작한 물건에 잘 맞습니다. 서랍 안에서도 두께가 덜 나와 정리 사진이 예쁘게 남아요.",
          "큐브·지퍼형은 케이블·이어폰·비상약·문구처럼 부피가 있는 소품에 적합합니다. 현관 근처 ‘나갈 때 챙김’ 키트로 쓰면 분실이 줄어듭니다.",
          "거실·작업 공간에는 같은 디자인에 라벨만 다르게 한 3~4개 세트가 보기 좋습니다. 인테리어 컬러와 맞춘 원단·잉크를 고르면 이질감이 없습니다.",
        ],
        productsTitle: "추천 파우치",
        products: [
          { slug: "pouch-flat", caption: "슬림 수납" },
          { slug: "pouch-cube", caption: "입체 수납" },
          { slug: "pouch", caption: "기본 지퍼" },
        ],
      },
      {
        title: "라벨·문구 예시",
        body: [
          "‘KEYS’, ‘CABLES’, ‘FIRST AID’, ‘우리집’, 가족 이니셜처럼 짧고 기능적인 단어가 인쇄와 사용성 모두에 유리합니다. 손글씨체보다 고딕·산세리프가 작은 면에서 또렷합니다.",
          "방 이름(거실 / 서재 / 키즈)을 넣으면 이사·정리할 때도 구분이 쉽습니다. 과도한 일러스트보다 타이포 + 작은 아이콘 조합을 추천합니다.",
        ],
        tipsTitle: "정리 팁",
        tips: [
          "같은 시안에 텍스트만 바꿔 시리즈로 주문하세요.",
          "어두운 원단 + 밝은 글자가 멀리서도 잘 보입니다.",
          "집들이 선물용은 2~3개 세트로 포장하면 좋습니다.",
        ],
      },
    ],
    faq: [
      {
        q: "세탁이 가능한가요?",
        a: "원단에 따라 다르지만, 가능하면 단독·찬물·뒤집어 세탁을 권장합니다. 인쇄면 직접 다림질은 피해주세요.",
      },
      {
        q: "여러 개에 다른 문구를 넣을 수 있나요?",
        a: "네. 시안을 문구별로 저장해 각각 주문하거나, 문의로 시리즈 제작을 요청할 수 있습니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "travel-essentials",
    title: "여행 필수템",
    subtitle: "에코백 · 장바구니",
    date: "2026.08.16",
    coverImageUrl: "/images/trip.png",
    cardGradient: "from-sky-200 to-blue-100",
    sortOrder: 2,
    intro: [
      "공항·기차역·현지 시장·피크닉까지, 여행 중에는 ‘갑자기 생긴 짐’을 담을 가방이 꼭 필요합니다. 접이식 장바구니와 미니·크로스 에코백을 여행 컨셉으로 꾸미면 실용과 인증샷을 한 번에 잡을 수 있어요.",
      "목적지 이름, 여행 날짜, 짧은 슬로건(‘see you there’)만 넣어도 기념품 느낌이 납니다. 가족·친구 여행이라면 같은 시안으로 맞춰 분실 방지에도 도움이 됩니다.",
      "아래 구성은 기내용·현지 장보기·데일리 크로스까지 상황별로 나눠 추천합니다.",
    ],
    sections: [
      {
        title: "여행용 추천 구성",
        body: [
          "기내용으로는 미니 에코백이 가볍고 자리도 적게 차지합니다. 목베개·간식·충전기만 넣어도 ‘좌석 옆 정리’가 쉬워집니다.",
          "현지 마트·기념품 쇼핑에는 접이식 장바구니가 정답에 가깝습니다. 가방에 넣어 두었다가 필요할 때만 펼치면 되고, 여행 로고를 넣으면 다른 사람과 섞일 일도 줄어듭니다.",
          "시내 산책·프리마켓에는 크로스 에코백이 양손을 자유롭게 해 줍니다. 여권·폰·카드만 넣는 슬림 활용에도 잘 맞아요.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag-mini", caption: "기내용" },
          { slug: "shopping-bag-fold", caption: "접이식" },
          { slug: "ecobag-cross", caption: "크로스" },
          { slug: "shopping-bag", caption: "장보기 기본" },
        ],
      },
      {
        title: "문구·컬러 아이디어",
        body: [
          "도시명 + 연도, 항공편 코드 느낌의 타이포, ‘day 1 / day 2’ 같은 짧은 라벨이 여행 감성과 잘 맞습니다. 과도한 지도 이미지보다 타이포 중심이 인쇄 실패가 적습니다.",
          "짐이 많은 단체 여행은 가방 색을 멤버별로 다르게, 로고만 동일하게 맞추면 캐러셀·버스에서 찾기 쉽습니다.",
        ],
        tipsTitle: "챙김 팁",
        tips: [
          "접이식은 캐리어 사이드 포켓에 넣어 두세요.",
          "미니는 기내 앞주머니용으로 하나 더 있으면 편합니다.",
          "기념 시안은 저장해 다음 여행에 도시명만 바꿔 재사용하세요.",
        ],
      },
    ],
    faq: [
      {
        q: "접이식 장바구니에도 풀컬러 인쇄가 되나요?",
        a: "상품 옵션에 따라 인쇄면·방식이 다를 수 있습니다. 상세 페이지와 빌더 가이드를 확인해 주세요.",
      },
      {
        q: "여행 기념으로 소량만 만들어도 되나요?",
        a: "네. 1개부터 제작 가능해 가족·커플 여행 기념용으로 많이 주문합니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "pet-walk",
    title: "반려동물 산책",
    subtitle: "산책용 파우치",
    date: "2026.08.14",
    coverImageUrl: "/images/pet.png",
    cardGradient: "from-emerald-200 to-green-100",
    sortOrder: 3,
    intro: [
      "간식·배변봉투·키·물티슈를 한곳에 모으는 산책 파우치는 보호자에게 필수템입니다. 여기에 반려동물 이름, 실루엣, 짧은 슬로건을 넣으면 분실 방지와 애정 표현을 동시에 할 수 있어요.",
      "JH MAKER에서는 지퍼형·플랫 파우치를 1개부터 맞출 수 있어, 다견·다묘 가정도 아이별로 다른 컬러를 주기 쉽습니다. 산책 인증샷용 소품으로도 반응이 좋습니다.",
      "아래에서는 수납 기준, 디자인 팁, 추천 상품을 정리했습니다.",
    ],
    sections: [
      {
        title: "산책 파우치 고르기",
        body: [
          "매일 쓰는 용도라면 지퍼형 기본 파우치가 내용물 이탈이 적습니다. 주머니에 넣기 좋게 슬림하게 가져가려면 플랫형이 편합니다.",
          "간식 봉지가 크다면 큐브형이 여유 있습니다. ‘간식 / 배변 / 기타’처럼 파우치를 나눠 쓰면 손에 묻히지 않고 꺼내기가 빨라집니다.",
          "목줄·하네스 색과 맞추거나, 반려동물 메인 컬러를 잉크로 쓰면 세트감이 살아납니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "pouch", caption: "기본 지퍼" },
          { slug: "pouch-flat", caption: "슬림" },
          { slug: "pouch-cube", caption: "넉넉한 수납" },
          { slug: "ready-pouch-zip", caption: "기성 지퍼" },
        ],
      },
      {
        title: "이름·일러스트 넣는 법",
        body: [
          "이름 + 작은 발바닥·뼈다귀·생선 아이콘 조합이 무난합니다. 복잡한 사진보다 심플한 실루엣이 작은 인쇄면에서 선명합니다.",
          "연락처를 넣는 경우 개인정보 노출에 유의하세요. 닉네임·SNS 핸들 정도만 넣는 보호자가 많습니다.",
        ],
        tipsTitle: "사용 팁",
        tips: [
          "배변봉투는 지퍼 안쪽 전용 칸처럼 한쪽에 모아 두세요.",
          "세탁 가능한 원단이면 산책 후 관리가 쉽습니다.",
          "같은 시안으로 미니 에코백을 만들면 ‘산책 가방’이 됩니다.",
        ],
        productsTitle: "함께 맞추기",
        products: [{ slug: "ecobag-mini", caption: "산책 미니백" }],
      },
    ],
    faq: [
      {
        q: "반려동물 사진도 인쇄할 수 있나요?",
        a: "고해상도 사진이면 가능합니다. 배경이 복잡하면 플랫 일러스트·실루엣이 더 또렷할 수 있습니다.",
      },
      {
        q: "물에 강한가요?",
        a: "일상 산책 수준의 사용을 기준으로 하며, 완전 방수는 아닙니다. 물티슈·간식 포장은 지퍼 안에 넣어 주세요.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "flea-market",
    title: "마켓·플리마켓",
    subtitle: "장바구니 대량",
    date: "2026.08.12",
    coverImageUrl: "/images/market.png",
    cardGradient: "from-stone-200 to-zinc-100",
    sortOrder: 4,
    intro: [
      "부스 로고와 마켓명이 들어간 장바구니는 방문객 안내용·구매 기념품·브랜드 패키지를 한 번에 해결합니다. 셀러가 자체 로고를 넣은 에코백·장바구니를 포장 겸 굿즈로 쓰는 사례도 늘고 있어요.",
      "JH MAKER에서는 소량 테스트 판매부터 대량 배포까지 수량 구간에 따라 단가를 낮출 수 있습니다. 첫 마켓은 소량으로 반응을 보고, 인기 디자인만 재주문하는 운영이 안전합니다.",
      "아래에서는 수량 산정, 디자인 위계, 추천 상품을 실무 기준으로 정리했습니다.",
    ],
    sections: [
      {
        title: "행사 수량·용도 나누기",
        body: [
          "방문객 무료 배포와 유료 판매용 수량을 나눠 주문하면 재고·정산이 명확해집니다. 배포용은 접이식·미니, 판매·장보기 체험은 와이드·기본형이 잘 맞습니다.",
          "예상 방문 × 배포율(보통 15~30%) + 여유 10%가 기본 공식입니다. 우천·파손·스태프용을 빼먹지 마세요.",
          "셀러 패키징용이라면 ‘구매 고객 수 × 객단가 구간’을 기준으로 주 단위 재주문하는 편이 재고 부담이 적습니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "shopping-bag", caption: "기본" },
          { slug: "shopping-bag-wide", caption: "와이드" },
          { slug: "shopping-bag-fold", caption: "접이식" },
          { slug: "ecobag", caption: "브랜드 패키지" },
        ],
      },
      {
        title: "부스 브랜딩에 맞는 디자인",
        body: [
          "멀리서도 읽히게 마켓명·부스명은 크게, 날짜·위치·SNS는 작게 두는 위계가 중요합니다. 포스터와 같은 키 비주얼을 쓰면 현장 톤이 통일됩니다.",
          "크림·밝은 원단에 진한 로고가 실패가 적고, 풀블리드 사진보다 로고+타이포가 대량 인쇄에 유리합니다.",
        ],
        tipsTitle: "운영 팁",
        tips: [
          "입구 배포용 / 부스 판매용 SKU를 분리하세요.",
          "다음 회차 마켓은 날짜만 바꿔 재사용하세요.",
          "에코백 소량을 VIP·얼리버드 특전으로 쓰면 객단가가 올라갑니다.",
        ],
      },
    ],
    faq: [
      {
        q: "대량 납기는 얼마나 보나요?",
        a: "수량에 따라 다르지만 보통 영업일 3~5일 출고를 목표로 합니다. 행사일이 정해져 있으면 여유를 두고 주문해 주세요.",
      },
      {
        q: "다른 셀러와 디자인이 겹치지 않게 하려면?",
        a: "워드마크·시그니처 컬러를 분명히 하고, 마켓 공통 배지보다 내 로고 비중을 높이는 편이 좋습니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "welcome-kit",
    title: "기업 웰컴 키트",
    subtitle: "브랜드 맞춤",
    date: "2026.08.10",
    coverImageUrl: "/images/company.png",
    cardGradient: "from-zinc-200 to-slate-100",
    sortOrder: 5,
    intro: [
      "입사자·파트너·캠퍼스 리크루팅 웰컴 키트에 로고 에코백과 파우치를 넣으면, 첫인상이 ‘서류 봉투’가 아니라 ‘브랜드 경험’으로 바뀝니다. 실사용 아이템이라 폐기율이 낮고, ESG·친환경 메시지와도 잘 맞아요.",
      "JH MAKER는 1개부터 시범 제작이 가능해 디자인 컨펌용 샘플을 먼저 만들고, 확정 후 기수에 맞춰 본 발주하기 좋습니다. 수량 할인 구간을 활용하면 기수·채용 시즌 예산을 효율적으로 쓸 수 있습니다.",
      "아래는 키트 구성 예시, 로고 가이드, 발주 체크리스트입니다.",
    ],
    sections: [
      {
        title: "키트 구성 예시",
        body: [
          "가장 무난한 조합은 ‘에코백(메인) + 플랫 파우치(케이블·카드·온보딩 안내)’입니다. 단가를 맞추기 쉽고, 가방 안에 파우치를 넣어 포장하면 언박싱도 깔끔합니다.",
          "임원·파트너용은 라운드·크로스처럼 형태를 업그레이드하고, 신입·대량 배포는 사각·미니로 효율을 내는 2-티어 구성도 많이 씁니다.",
          "기성 무지 에코백에 스티커만 붙이는 임시 키트보다, 처음부터 브랜드 컬러로 인쇄한 버전이 회수·재사용 이미지가 좋습니다.",
        ],
        productsTitle: "추천 구성",
        products: [
          { slug: "ecobag", caption: "메인 백" },
          { slug: "pouch-flat", caption: "키트 파우치" },
          { slug: "ecobag-mini", caption: "대량 배포" },
          { slug: "ready-ecobag-basic", caption: "기성 옵션" },
        ],
      },
      {
        title: "로고·가이드·승인 프로세스",
        body: [
          "브랜드 가이드의여백·지정 색·금지 변형)를 먼저 받고, 벡터 원본으로 시안을 만드세요. 화면 캡처 PNG는 가장자리가 깨지기 쉽습니다.",
          "사내 승인 경로가 길다면 ‘샘플 1~5개 → 부서 컨펌 → 본 발주’ 순서를 일정표에 고정하세요. 시안 수정이 출고 지연의 가장 큰 원인입니다.",
        ],
        tipsTitle: "발주 체크",
        tips: [
          "입사일·행사일 기준 최소 1~2주 여유",
          "부서/기수별 수량 시트를 만들어 오발주 방지",
          "직원용·외부배포용 색상 구분",
          "재주문용으로 확정 시안 저장",
        ],
      },
    ],
    faq: [
      {
        q: "세금계산서·대량 견적이 가능한가요?",
        a: "사업자 주문·대량 견적은 1:1 문의로 수량과 납기를 남겨 주시면 안내드립니다.",
      },
      {
        q: "로고 색을 정확히 맞출 수 있나요?",
        a: "인쇄·원단에 따라 미세한 차이가 있을 수 있습니다. 브랜드 컬러가 민감하면 샘플 후 본 제작을 권장합니다.",
      },
      {
        q: "여러 계열사 로고를 함께 넣을 수 있나요?",
        a: "가능합니다. 다만 로고가 많으면 가독성이 떨어지니 크기·간격을 통일해 배치하세요.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "fan-meeting",
    title: "팬미팅 굿즈",
    subtitle: "최애 굿즈 제작",
    date: "2026.08.08",
    coverImageUrl: "/images/goods.png",
    cardGradient: "from-rose-100 to-orange-50",
    sortOrder: 6,
    intro: [
      "슬로건·멤버 컬러·날짜를 넣은 미니 에코백·파우치는 팬미팅·콘서트·생일 카페 현장 배포와 소량 MD에 특히 잘 맞습니다. 단가가 낮아 수량 확보가 쉽고, 인증샷 소품으로도 바로 쓰입니다.",
      "JH MAKER는 1개부터 제작 가능해 개인 덕질 제작부터 팬덤 단체 주문까지 같은 흐름으로 진행할 수 있습니다. 반응이 좋은 시안은 저장 후 추가 제작하면 됩니다.",
      "저작권·초상권이 있는 공식 이미지는 사용 권한이 있는 범위에서만 활용하고, 슬로건·응원봉 컬러·날짜 중심 디자인을 추천합니다.",
    ],
    sections: [
      {
        title: "배포용 vs 판매용",
        body: [
          "현장 무료 배포는 미니 에코백·플랫 파우치 위주가 효율적입니다. 부피가 작아 스태프 운반이 쉽고, 관객도 다른 짐과 함께 들기 좋습니다.",
          "부스 판매 MD는 사각 에코백처럼 ‘갖고 싶은 사이즈’를 메인으로, 파우치를 저가 라인으로 두는 2단 구성이 객단가에 유리합니다.",
          "멤버·버전별로 컬러만 다르게 맞추면 SKU는 늘어나도 시안 작업량은 크게 늘지 않습니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag-mini", caption: "배포용" },
          { slug: "pouch", caption: "파우치" },
          { slug: "pouch-flat", caption: "플랫" },
          { slug: "ecobag", caption: "판매 메인" },
        ],
      },
      {
        title: "안전한 디자인 가이드",
        body: [
          "공식 로고·초상·음원 아트를 무단으로 쓰지 마세요. 팬메이드는 오리지널 타이포·응원 문구·일정·장소 중심이 안전합니다.",
          "글자는 짧고 굵게. 응원봉 불빛 아래에서도 읽히게 대비를 강하게 주세요. 해시태그는 한 줄로 제한하는 편이 좋습니다.",
        ],
        tipsTitle: "현장 팁",
        tips: [
          "입장·퇴장 동선에 맞춰 배포 포인트를 나누세요.",
          "우천·분실 대비 여유 분량 10%를 확보하세요.",
          "버전별 재고표를 엑셀로 만들어 혼선을 줄이세요.",
        ],
      },
    ],
    faq: [
      {
        q: "개인이 소량만 만들어도 되나요?",
        a: "네. 1개부터 가능해 생일 카페·개인 덕질 제작에 많이 쓰입니다.",
      },
      {
        q: "공식 아티스트 사진을 넣어도 되나요?",
        a: "권한이 있는 이미지만 사용해 주세요. 불명확하면 타이포·일정 중심 디자인으로 제작하는 것을 권장합니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "cafe-opening",
    title: "카페 오픈 기념",
    subtitle: "에코백 + 파우치",
    date: "2026.08.06",
    coverImageUrl: "/images/coffee.png",
    cardGradient: "from-yellow-100 to-amber-50",
    sortOrder: 7,
    intro: [
      "오픈 기념 스탬프 이벤트·첫 방문 특전·시즌 MD로 에코백·파우치를 활용하면, 일회성 할인보다 오래 남는 브랜드 기억을 만들 수 있습니다. 상호와 오픈일만 넣어도 ‘그날의 매장’이 굿즈에 남아요.",
      "JH MAKER에서는 오픈 전 소량(30~50개)으로 반응을 본 뒤, 인기 시안만 추가 제작하는 운영이 가능합니다. 테이크아웃 백 대용으로 쓰면 포장비 절감과 홍보를 동시에 노릴 수 있습니다.",
      "아래 구성은 오픈 키트, 시즌 확장, 문구 예시까지 카페 실무 기준으로 정리했습니다.",
    ],
    sections: [
      {
        title: "카페 추천 구성",
        body: [
          "테이크아웃용 메인 에코백 + 원두·쿠키 키트용 파우치 조합이 가장 많이 쓰입니다. 에코백은 방문 리워드, 파우치는 온라인·매장 MD로 역할을 나누면 재고 관리가 쉽습니다.",
          "라운드·시즌 컬러 에코백은 ‘가을 메뉴 출시’처럼 기간 한정 느낌을 주기 좋고, 미니는 스탬프 완주 증정용으로 단가가 맞습니다.",
          "직원용과 고객용 색을 다르게 두면, 매장에서 누가 직원 키트인지 바로 구분됩니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag", caption: "테이크아웃" },
          { slug: "ecobag-round", caption: "시즌" },
          { slug: "ecobag-mini", caption: "스탬프 증정" },
          { slug: "pouch", caption: "원두 키트" },
        ],
      },
      {
        title: "문구·이벤트 설계",
        body: [
          "‘OPEN YYYY.MM.DD’, 시그니처 메뉴명, ‘오늘도 좋은 하루’처럼 짧은 문장이 매장 톤과 잘 맞습니다. 메뉴판 폰트와 맞추면 브랜딩이 이어집니다.",
          "스탬프 10회 → 미니 에코백, 20회 → 사각 에코백처럼 단계형 리워드를 주면 재방문 동기가 분명해집니다. 시즌마다 문구만 바꿔 재주문하세요.",
        ],
        tipsTitle: "오픈 체크",
        tips: [
          "오픈 2주 전 샘플 확정",
          "첫 주 예상 방문 기준으로 배포율 20~40% 산정",
          "포장용 / 리워드용 수량 분리",
          "인스타용 플랫레이 사진용 여분 5~10개",
        ],
      },
    ],
    faq: [
      {
        q: "로고 파일만 있어도 되나요?",
        a: "네. 로고만 빌더에 올려도 충분합니다. 배경 제거가 필요하면 주문 메모에 남겨 주세요.",
      },
      {
        q: "오픈 당일까지 가능한가요?",
        a: "여유 일정을 권장합니다. 급하면 문의로 희망일과 수량을 남겨 주시면 가능 여부를 안내합니다.",
      },
      {
        q: "시즌마다 다시 만들 수 있나요?",
        a: "확정 시안을 저장해 두고 문구·컬러만 바꿔 재주문하면 됩니다.",
      },
    ],
  },
];

export const DEFAULT_CASE_ARTICLES: ContentArticlePayload[] = [
  {
    type: "CASE",
    slug: "cafe-open-tote",
    title: "동네 카페 오픈 토트백",
    subtitle: "로고 하나만 올려도 테이크아웃 백이 된 사례",
    date: "2026.10.12",
    coverImageUrl: "/mockups/canvas_front-removebg-preview.png",
    cardTag: "카페",
    cardGradient: "from-stone-100 to-zinc-50",
    sortOrder: 0,
    intro: [
      "오픈을 앞둔 동네 카페에서 일회용 봉투 대신 쓸 토트백을 만들었습니다. 매장 로고와 짧은 슬로건만 앞면에 올려, 음료를 담아 나가는 순간부터 매장 밖 홍보가 되게 했습니다.",
      "수량은 오픈 주 스태프용과 스탬프 리워드용으로 나눠 잡았고, 색은 크림 본체에 손잡이만 먹색으로 맞춰 매장 인테리어와 톤을 맞췄습니다.",
    ],
    sections: [
      {
        title: "이렇게 구성했습니다",
        body: [
          "인쇄는 앞면 중앙에 로고와 한 줄 문구만 넣었습니다. 원두 이름이나 긴 설명은 빼고, 들고 다닐 때 한눈에 들어오게 여백을 넓게 잡았습니다.",
          "사이즈는 음료 두 잔과 디저트가 들어가는 M을 기준으로 했고, 뒷면은 비워 두어 시즌 스탬프를 나중에 추가할 수 있게 했습니다.",
        ],
        tipsTitle: "카페 굿즈에서 잘 먹힌 점",
        tips: [
          "로고는 작게, 여백은 크게",
          "손잡이 색만 포인트로 분리",
          "리워드용과 판매용 수량을 나눠 주문",
        ],
        productsTitle: "이 사례에 쓴 상품",
        products: [
          { slug: "canvas-tote-illustration", caption: "일러스트·로고용 토트백" },
        ],
      },
    ],
    faq: [
      {
        q: "로고 파일만 있어도 되나요?",
        a: "네. 로고만 올려도 제작할 수 있습니다. 배경 정리가 필요하면 주문 메모에 적어 주세요.",
      },
    ],
  },
  {
    type: "CASE",
    slug: "market-crossbody",
    title: "마켓 셀러 크로스백",
    subtitle: "양손을 비우는 어깨 스트랩 굿즈",
    date: "2026.09.28",
    coverImageUrl: "/mockups/tote_front-removebg-preview.png",
    cardTag: "마켓",
    cardGradient: "from-amber-50 to-orange-50",
    sortOrder: 1,
    intro: [
      "플리마켓 셀러가 부스 운영용으로 맞춘 크로스백입니다. 계산과 포장을 하면서도 가방을 내려놓지 않도록 길이 조절 스트랩을 달고, 부스 이름만 작게 인쇄했습니다.",
      "손님에게 같은 시안을 소량 판매용으로도 쓸 수 있게, 인쇄는 한 가지로 통일하고 색만 크림으로 맞췄습니다.",
    ],
    sections: [
      {
        title: "현장에서 이렇게 썼습니다",
        body: [
          "앞면에는 마켓명과 셀러명을 한 줄로 넣었습니다. 복잡한 일러스트 대신 타이포만 써서, 멀리서도 부스 이름이 읽히게 했습니다.",
          "스트랩은 네이비로 골라 크림 본체와 대비를 주고, 손잡이는 짧게 남겨 진열할 때도 형태가 무너지지 않게 했습니다.",
        ],
        productsTitle: "이 사례에 쓴 상품",
        products: [
          { slug: "canvas-cross-strap", caption: "길이 조절 스트랩 크로스백" },
        ],
      },
    ],
    faq: [],
  },
  {
    type: "CASE",
    slug: "wine-shop-bottle-bag",
    title: "와인샵 보틀백",
    subtitle: "배색 손잡이로 포장과 홍보를 같이",
    date: "2026.09.04",
    coverImageUrl: "/mockups/wine_bag_mockup_front-removebg-preview.png",
    cardTag: "리테일",
    cardGradient: "from-rose-50 to-red-50",
    sortOrder: 2,
    intro: [
      "병 한두 개를 들고 나가는 손님을 위해 만든 보틀백입니다. 샵 로고를 손잡이 아래 좁은 면에 맞추고, 손잡이만 와인색에 가까운 포인트 컬러로 골랐습니다.",
      "종이 쇼핑백 대신 재사용 가방으로 바꾸면서, 포장비가 브랜드가 남도록 한 사례입니다.",
    ],
    sections: [
      {
        title: "인쇄 위치",
        body: [
          "보틀백은 인쇄면이 좁아서 로고를 크게 키우지 않았습니다. 병 실루엣을 가리지 않게 상단 중앙에만 배치했습니다.",
        ],
        productsTitle: "이 사례에 쓴 상품",
        products: [
          {
            slug: "canvas-bottle-contrast-handle",
            caption: "배색 손잡이 보틀백",
          },
        ],
      },
    ],
    faq: [],
  },
  {
    type: "CASE",
    slug: "festival-mini-tote",
    title: "페스티벌 미니 토트",
    subtitle: "현장 배포용으로 작게, 조리개로 안전하게",
    date: "2026.08.16",
    coverImageUrl: "/mockups/mini_front-removebg-preview.png",
    cardTag: "행사",
    cardGradient: "from-violet-50 to-zinc-50",
    sortOrder: 3,
    intro: [
      "페스티벌 입장 키트용으로 만든 미니 토트입니다. 티켓과 팜플렛, 작은 굿즈가 들어가게 사이즈를 줄이고, 조리개로 입구를 닫을 수 있게 했습니다.",
      "날짜와 행사명만 앞면에 넣어 대량 배포에서도 인쇄가 흐리지 않게 했습니다.",
    ],
    sections: [
      {
        title: "배포용으로 맞춘 점",
        body: [
          "한 손에 들어오는 크기라 스태프가 쌓아 두기도 쉽고, 관객은 목에 걸거나 손에 들고 이동할 수 있습니다.",
          "컬러는 아이보리 본체에 조리개 끈만 포인트 색으로 둬서, 행사 포스터의 메인 컬러와 맞췄습니다.",
        ],
        productsTitle: "이 사례에 쓴 상품",
        products: [
          { slug: "canvas-mini-drawstring", caption: "조리개 미니 토트백" },
        ],
      },
    ],
    faq: [],
  },
];

export function defaultGuidePayloads(): ContentArticlePayload[] {
  return GUIDE_ARTICLES.map((a, i) => ({
    type: "GUIDE" as const,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    date: a.date,
    intro: a.intro,
    sections: a.sections,
    faq: a.faq,
    cardGradient: a.cardGradient,
    coverImageUrl: null,
    cardTag: null,
    sortOrder: i,
  }));
}

export function toPrismaCreateData(
  payload: ContentArticlePayload,
): Prisma.ContentArticleCreateInput {
  const publishedAt = payload.date
    ? new Date(payload.date.replace(/\./g, "-"))
    : new Date();
  return {
    type: payload.type,
    slug: payload.slug,
    title: payload.title,
    subtitle: payload.subtitle,
    coverImageUrl: payload.coverImageUrl ?? null,
    cardTag: payload.cardTag ?? null,
    cardGradient: payload.cardGradient ?? null,
    introJson: payload.intro,
    sectionsJson: payload.sections,
    faqJson: payload.faq,
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    sortOrder: payload.sortOrder ?? 0,
    isActive: true,
  };
}
