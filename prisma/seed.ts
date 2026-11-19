import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_IDEA_ARTICLES,
  defaultGuidePayloads,
  toPrismaCreateData,
} from "../src/lib/content-article";
import {
  LEGACY_STOREFRONT_CATEGORY_SLUGS,
  STOREFRONT_CATEGORY_DEFS,
} from "../src/lib/storefront-categories";

const prisma = new PrismaClient();

function mockupFace(
  side: "front" | "back",
  imageUrl: string,
  imageWidth: number,
  imageHeight: number,
  printX: number,
  printY: number,
  printW: number,
  printH: number,
  sortOrder: number,
) {
  return {
    side,
    label: side === "front" ? "앞면" : "뒷면",
    imageUrl,
    imageWidth,
    imageHeight,
    printX,
    printY,
    printW,
    printH,
    sortOrder,
  };
}


const ACCOUNTS = [
  {
    email: "admin@hmaker.com",
    name: "관리자",
    password: "JhAdmin!2026",
    role: "ADMIN" as const,
  },
  {
    email: "customer@hmaker.com",
    name: "고객",
    password: "JhCustomer!2026",
    role: "CUSTOMER" as const,
  },
  {
    email: "test@naver.com",
    name: "테스트고객",
    password: "JhTest!2026",
    role: "CUSTOMER" as const,
  },
  {
    email: "test2@naver.com",
    name: "테스트관리자",
    password: "JhAdmin!2026",
    role: "ADMIN" as const,
  },
];

async function main() {
  // ── 상품 카테고리 (스토어프론트 목록) ──
  const categories: Record<string, { id: string }> = {};
  for (const c of STOREFRONT_CATEGORY_DEFS) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      create: {
        slug: c.slug,
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
    categories[c.slug] = { id: row.id };
  }

  await prisma.category.updateMany({
    where: { slug: { in: LEGACY_STOREFRONT_CATEGORY_SLUGS } },
    data: { isActive: false },
  });

  // ── 에코백·토트백 실상품 4종 ──
  const bagOptionSchema = {
    sizes: ["S", "M", "L"],
    fabrics: ["canvas"],
    colors: ["cream", "white", "ivory", "beige"],
    handleStrapColors: ["cream", "white", "ivory", "beige", "navy", "black"],
  };

  const productDefs = [
    {
      slug: "canvas-cross-strap",
      builderType: "ecobag",
      name: "길이 조절 스트랩 캔버스 크로스백",
      shortDesc: "길이 조절 스트랩이 달린 캔버스 크로스백",
      description:
        "어깨에 메는 길이 조절 스트랩과 손잡이가 함께 있는 캔버스 크로스백입니다. 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 1,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/tote_front-removebg-preview.png",
      categoryId: categories["ecobag-tote"].id,
      optionSchema: bagOptionSchema,
      faces: [
        mockupFace("front", "/mockups/tote_front-removebg-preview.png", 499, 500, 0.361, 0.526, 0.332, 0.298, 0),
        mockupFace("back", "/mockups/tote_back-removebg-preview.png", 499, 500, 0.301, 0.524, 0.333, 0.299, 1),
      ],
    },
    {
      slug: "canvas-bottle-contrast-handle",
      builderType: "ecobag",
      name: "배색 손잡이 캔버스 보틀백",
      shortDesc: "배색 손잡이가 포인트인 캔버스 보틀백",
      description:
        "본체와 손잡이 색이 다른 캔버스 보틀백입니다. 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/wine_bag_mockup_front-removebg-preview.png",
      categoryId: categories["ecobag-tote"].id,
      optionSchema: bagOptionSchema,
      faces: [
        mockupFace("front", "/mockups/wine_bag_mockup_front-removebg-preview.png", 498, 501, 0.42, 0.41, 0.188, 0.37, 0),
        mockupFace("back", "/mockups/wine_bag_mockup_back-removebg-preview.png", 498, 501, 0.392, 0.409, 0.189, 0.372, 1),
      ],
    },
    {
      slug: "canvas-tote-illustration",
      builderType: "ecobag",
      name: "일러스트 인쇄 캔버스 토트백",
      shortDesc: "일러스트 인쇄에 맞춘 캔버스 토트백",
      description:
        "넓은 인쇄면이 있는 기본 캔버스 토트백입니다. 앞면·뒷면에 일러스트와 로고를 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 3,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/canvas_front-removebg-preview.png",
      categoryId: categories["ecobag-tote"].id,
      optionSchema: bagOptionSchema,
      faces: [
        mockupFace("front", "/mockups/canvas_front-removebg-preview.png", 447, 558, 0.294, 0.452, 0.404, 0.328, 0),
        mockupFace("back", "/mockups/canvas_back-removebg-preview.png", 447, 558, 0.311, 0.473, 0.381, 0.308, 1),
      ],
    },
    {
      slug: "canvas-mini-drawstring",
      builderType: "ecobag",
      name: "조리개 결합 캔버스 미니 토트백",
      shortDesc: "조리개가 결합된 캔버스 미니 토트백",
      description:
        "손잡이와 조리개가 함께 있는 미니 토트백입니다. 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 4,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/mini_front-removebg-preview.png",
      categoryId: categories["ecobag-tote"].id,
      optionSchema: bagOptionSchema,
      faces: [
        mockupFace("front", "/mockups/mini_front-removebg-preview.png", 500, 500, 0.324, 0.412, 0.348, 0.341, 0),
        mockupFace("back", "/mockups/mini_back-removebg-preview.png", 500, 500, 0.356, 0.428, 0.289, 0.319, 1),
      ],
    },
    // ── 조리개 파우치·더스트백 4종 ──
    {
      slug: "cotton-30s-drawstring-120x250",
      builderType: "pouch",
      name: "30수 광목 세로형 조리개 파우치 120x250",
      shortDesc: "세로형 120×250 광목 조리개 파우치",
      description:
        "30수 광목으로 만든 세로형 조리개 파우치입니다. 120×250 사이즈로 병·굿즈·소품을 담기 좋고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 1,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/30_pouch_front.png",
      categoryId: categories["drawstring-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/30_pouch_front.png", 1122, 1402, 0.34, 0.4, 0.32, 0.38, 0),
        mockupFace("back", "/mockups/30_pouch_back.png", 1122, 1402, 0.34, 0.4, 0.32, 0.38, 1),
      ],
    },
    {
      slug: "cotton-30s-drawstring-160x160",
      builderType: "pouch",
      name: "30수 광목 세로형 조리개 파우치 160x160",
      shortDesc: "정사각 160×160 광목 조리개 파우치",
      description:
        "30수 광목으로 만든 160×160 조리개 파우치입니다. 정사각 면에 로고·일러스트를 올리기 좋고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/160160_front.png",
      categoryId: categories["drawstring-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/160160_front.png", 1254, 1254, 0.28, 0.36, 0.44, 0.4, 0),
        mockupFace("back", "/mockups/160160_back.png", 1254, 1254, 0.28, 0.36, 0.44, 0.4, 1),
      ],
    },
    {
      slug: "beige-rope-drawstring-pouch",
      builderType: "pouch",
      name: "베이지 로프끈 조리개 파우치",
      shortDesc: "베이지 로프끈이 포인트인 조리개 파우치",
      description:
        "두꺼운 베이지 로프끈이 달린 조리개 파우치입니다. 본체와 끈의 질감이 잘 드러나며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 3,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/drawstring_front.png",
      categoryId: categories["drawstring-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/drawstring_front.png", 1279, 1230, 0.26, 0.34, 0.48, 0.42, 0),
        mockupFace("back", "/mockups/drawstring_back.png", 1395, 1127, 0.28, 0.3, 0.44, 0.42, 1),
      ],
    },
    {
      slug: "raw-20s-mini-drawstring-pouch",
      builderType: "pouch",
      name: "20수 생지 미니 조리개 파우치",
      shortDesc: "20수 생지 미니 사이즈 조리개 파우치",
      description:
        "20수 생지로 만든 미니 조리개 파우치입니다. 소형 굿즈·답례품용으로 적합하고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 4,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/20_mini_front.png",
      categoryId: categories["drawstring-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/20_mini_front.png", 1254, 1254, 0.28, 0.38, 0.44, 0.38, 0),
        mockupFace("back", "/mockups/20_mini_back.png", 1254, 1254, 0.28, 0.38, 0.44, 0.38, 1),
      ],
    },
    // ── 덮개형·플랫 더스트백 4종 ──
    {
      slug: "raw-20s-flap-dust-bag",
      builderType: "pouch",
      name: "20수 생지 덮개형 더스트백",
      shortDesc: "20수 생지 덮개형 플랫 더스트백",
      description:
        "20수 생지로 만든 덮개형 더스트백입니다. 플랩으로 입구를 가릴 수 있고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 1,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/0001.png",
      categoryId: categories["flat-dust-bag"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/0001.png", 1254, 1254, 0.26, 0.36, 0.48, 0.42, 0),
        mockupFace("back", "/mockups/0002.png", 1254, 1254, 0.26, 0.34, 0.48, 0.44, 1),
      ],
    },
    {
      slug: "raw-20s-rib-loop-sachet",
      builderType: "pouch",
      name: "20수 생지 골직 고리 샤쉐 파우치",
      shortDesc: "골직 고리가 달린 생지 샤쉐 파우치",
      description:
        "20수 생지에 골직 고리를 단 샤쉐 파우치입니다. 걸거나 걸쇠에 끼워 쓰기 좋고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/0003.png",
      categoryId: categories["flat-dust-bag"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/0003.png", 1254, 1254, 0.28, 0.38, 0.44, 0.4, 0),
        mockupFace("back", "/mockups/0004.png", 1254, 1254, 0.28, 0.38, 0.44, 0.4, 1),
      ],
    },
    {
      slug: "nonwoven-ultrasonic-flap-dust-bag",
      builderType: "pouch",
      name: "부직포 초음파 덮개형 더스트백",
      shortDesc: "초음파 접합 부직포 덮개형 더스트백",
      description:
        "부직포를 초음파로 접합한 덮개형 더스트백입니다. 가볍고 대량 제작에 적합하며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 3,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/0005.png",
      categoryId: categories["flat-dust-bag"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/0005.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 0),
        mockupFace("back", "/mockups/0006.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 1),
      ],
    },
    {
      slug: "foldable-nonwoven-flat-dust-bag",
      builderType: "pouch",
      name: "접이식 부직포 플랫 더스트백",
      shortDesc: "접어 보관하기 쉬운 부직포 플랫 더스트백",
      description:
        "접어서 보관하기 쉬운 부직포 플랫 더스트백입니다. 포장·보관용으로 쓰기 좋고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 4,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/0007.png",
      categoryId: categories["flat-dust-bag"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/0007.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 0),
        mockupFace("back", "/mockups/0008.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 1),
      ],
    },
    // ── 지퍼파우치 3종 ──
    {
      slug: "4color-canvas-zipper-pouch",
      builderType: "pouch",
      name: "4색 캔버스 지퍼 파우치",
      shortDesc: "컬러 캔버스 지퍼 파우치",
      description:
        "여러 색상으로 고를 수 있는 캔버스 지퍼 파우치입니다. 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 1,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/01_TOVE_pink_front.png",
      categoryId: categories["zipper-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/01_TOVE_pink_front.png", 900, 900, 0.18, 0.32, 0.64, 0.42, 0),
        mockupFace("back", "/mockups/01_TOVE_pink_back.png", 900, 900, 0.18, 0.32, 0.64, 0.42, 1),
      ],
    },
    {
      slug: "webbing-tyvek-vertical-zipper-bag",
      builderType: "pouch",
      name: "웨빙손잡이 세로형 타이벡 지퍼백",
      shortDesc: "웨빙 손잡이 타이벡 세로 지퍼백",
      description:
        "웨빙 손잡이가 달린 세로형 타이벡 지퍼백입니다. 가볍고 내구성이 좋으며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/02_white_black_handle_front.png",
      categoryId: categories["zipper-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/02_white_black_handle_front.png", 900, 900, 0.28, 0.34, 0.44, 0.42, 0),
        mockupFace("back", "/mockups/02_white_black_handle_back.png", 900, 900, 0.28, 0.34, 0.44, 0.42, 1),
      ],
    },
    {
      slug: "blue-zipper-graphic-canvas-pouch",
      builderType: "pouch",
      name: "파란 지퍼·그래픽 캔버스 파우치",
      shortDesc: "파란 지퍼가 포인트인 캔버스 파우치",
      description:
        "파란 지퍼가 포인트인 캔버스 파우치입니다. 그래픽·로고 인쇄에 적합하고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 3,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/03_blue_graphic_white_front.png",
      categoryId: categories["zipper-pouch"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige"],
      },
      faces: [
        mockupFace("front", "/mockups/03_blue_graphic_white_front.png", 900, 900, 0.2, 0.3, 0.6, 0.44, 0),
        mockupFace("back", "/mockups/03_blue_graphic_white_back.png", 900, 900, 0.2, 0.3, 0.6, 0.44, 1),
      ],
    },
    // ── 부직포 제품 ──
    {
      slug: "charcoal-nonwoven-diecut-handle-bag",
      builderType: "shopping-bag",
      name: "차콜 부직포 다이컷 손잡이 백",
      shortDesc: "차콜 부직포 다이컷 손잡이 백",
      description:
        "차콜 컬러 부직포로 만든 다이컷 손잡이 백입니다. 가볍고 대량 제작에 적합하며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 1,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/H2W_front_transparent.png",
      categoryId: categories["nonwoven"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige", "black"],
      },
      faces: [
        mockupFace("front", "/mockups/H2W_front_transparent.png", 649, 1112, 0.22, 0.38, 0.56, 0.4, 0),
        mockupFace("back", "/mockups/H2W_back_transparent.png", 656, 1105, 0.22, 0.38, 0.56, 0.4, 1),
      ],
    },
    // ── 기타가방·특수제작 2종 ──
    {
      slug: "corner-reinforced-black-poly-drawstring-backpack",
      builderType: "pouch",
      name: "모서리 보강 블랙 폴리 조리개 백팩",
      shortDesc: "모서리 보강 블랙 폴리 조리개 백팩",
      description:
        "모서리를 보강한 블랙 폴리 소재 조리개 백팩입니다. 가볍고 내구성이 좋으며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 1,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/black_front_fixed.png",
      categoryId: categories["custom-bags"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige", "black"],
      },
      faces: [
        mockupFace("front", "/mockups/black_front_fixed.png", 708, 710, 0.28, 0.32, 0.44, 0.42, 0),
        mockupFace("back", "/mockups/black_back_fixed.png", 708, 710, 0.28, 0.32, 0.44, 0.42, 1),
      ],
    },
    {
      slug: "print-strap-tyvek-drawstring-backpack",
      builderType: "pouch",
      name: "인쇄 스트랩 타이벡 조리개 배낭",
      shortDesc: "인쇄 스트랩 타이벡 조리개 배낭",
      description:
        "스트랩에 인쇄가 가능한 타이벡 조리개 배낭입니다. 가볍고 접어 보관하기 좋으며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
      basePrice: 0,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      thumbnailUrl: "/mockups/white_front.png",
      categoryId: categories["custom-bags"].id,
      optionSchema: {
        sizes: ["S", "M", "L"],
        fabrics: ["canvas"],
        colors: ["cream", "white", "ivory", "beige", "black"],
      },
      faces: [
        mockupFace("front", "/mockups/white_front.png", 610, 547, 0.28, 0.32, 0.44, 0.42, 0),
        mockupFace("back", "/mockups/white_back.png", 610, 547, 0.28, 0.32, 0.44, 0.42, 1),
      ],
    },
  ];

  const products: Record<string, { id: string }> = {};

  for (const p of productDefs) {
    const { faces, ...data } = p;
    const row = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: data.name,
        shortDesc: data.shortDesc,
        description: data.description,
        basePrice: data.basePrice,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        categoryId: data.categoryId,
        builderType: data.builderType,
        saleType: "CUSTOM",
        optionSchema: data.optionSchema,
        thumbnailUrl: data.thumbnailUrl,
        isActive: true,
        stockQuantity: null,
      },
      create: {
        ...data,
        saleType: "CUSTOM",
      },
    });
    products[p.slug] = row;

    await prisma.productMockupFace.deleteMany({ where: { productId: row.id } });
    await prisma.productMockupFace.createMany({
      data: faces.map((face) => ({ productId: row.id, ...face })),
    });
    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.createMany({
      data: faces.map((face) => ({
        productId: row.id,
        url: face.imageUrl,
        alt: `${p.name} ${face.label}`,
        sortOrder: face.sortOrder,
        isPrimary: face.side === "front",
      })),
    });
  }

  const mockupSourceByType: Record<string, string> = {};
  const readyMadeDefs: { slug: string }[] = [];

  // ── 수량별 할인 ──
  const discountRules: {
    slug: string;
    minQuantity: number;
    unitPrice: number;
    label: string;
  }[] = [];

  for (const rule of discountRules) {
    const product = products[rule.slug];
    if (!product) continue;
    const existing = await prisma.quantityDiscountRule.findFirst({
      where: { productId: product.id, minQuantity: rule.minQuantity },
    });
    if (existing) {
      await prisma.quantityDiscountRule.update({
        where: { id: existing.id },
        data: { unitPrice: rule.unitPrice, label: rule.label },
      });
    } else {
      await prisma.quantityDiscountRule.create({
        data: {
          productId: product.id,
          minQuantity: rule.minQuantity,
          unitPrice: rule.unitPrice,
          label: rule.label,
        },
      });
    }
  }

  // ── 컬렉션 ──
  const collections = [
    { slug: "best", name: "재구매 베스트", type: "BEST" as const },
    { slug: "new", name: "신상품", type: "NEW" as const },
    { slug: "trending", name: "요즘 많이 커스텀", type: "TRENDING" as const },
    { slug: "quick-template", name: "1분컷 템플릿", type: "TEMPLATE" as const },
  ];

  for (const col of collections) {
    const collection = await prisma.productCollection.upsert({
      where: { slug: col.slug },
      update: { name: col.name, type: col.type },
      create: col,
    });

    const bagSlugs = productDefs.map((p) => p.slug);
    const slugs = bagSlugs;

    for (let i = 0; i < slugs.length; i++) {
      const productId = products[slugs[i]]?.id;
      if (!productId) continue;
      await prisma.productCollectionItem.upsert({
        where: {
          collectionId_productId: {
            collectionId: collection.id,
            productId,
          },
        },
        update: { sortOrder: i },
        create: {
          collectionId: collection.id,
          productId,
          sortOrder: i,
        },
      });
    }
  }

  // ── 메인 배너 ──
  const banners = [
    {
      tag: "CUSTOM GOODS STUDIO",
      title: "당신의 상상이\n현실이 되는 곳",
      subtitle:
        "나만의 디자인으로 만드는 특별한 굿즈 쇼핑몰.\n상상을 현실로 만들어보세요.",
      linkUrl: "/products/canvas-tote-illustration",
      imageUrl: "/images/final_banner_with_printing_detail.png",
      sortOrder: 0,
    },
    {
      tag: null,
      title: "원하는 모양 그대로\n에코백 만들기",
      subtitle: "본체와 끈 색을 골라, 나만의 디자인을 한 개부터 제작하세요.",
      linkUrl: "/products/canvas-tote-illustration",
      imageUrl: "/images/banner2.png",
      sortOrder: 1,
    },
    {
      tag: null,
      title: "나만의 패턴,\n지퍼 파우치",
      subtitle: "원하는 디자인을 담아, 들고 다니기 좋은 소형 굿즈.",
      linkUrl: "/products/canvas-mini-drawstring",
      imageUrl: "/images/banner3.png",
      sortOrder: 2,
    },
  ];

  await prisma.banner.deleteMany({ where: { placement: "HOME_HERO" } });
  for (const b of banners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_HERO", isActive: true },
    });
  }

  const ideaBanners = [
    {
      tag: null,
      title: "커플 에코백",
      subtitle: "우정 · 커플 굿즈",
      linkUrl: "/ideas/couple-ecobag",
      imageUrl: "/images/couple_ecobag.png",
      sortOrder: 0,
    },
    {
      tag: null,
      title: "집꾸미기",
      subtitle: "파우치 · 수납",
      linkUrl: "/ideas/home-deco",
      imageUrl: "/images/house.png",
      sortOrder: 1,
    },
    {
      tag: null,
      title: "여행 필수템",
      subtitle: "에코백 · 장바구니",
      linkUrl: "/ideas/travel-essentials",
      imageUrl: "/images/trip.png",
      sortOrder: 2,
    },
    {
      tag: null,
      title: "반려동물 산책",
      subtitle: "산책용 파우치",
      linkUrl: "/ideas/pet-walk",
      imageUrl: "/images/pet.png",
      sortOrder: 3,
    },
    {
      tag: null,
      title: "마켓·플리마켓",
      subtitle: "장바구니 대량",
      linkUrl: "/ideas/flea-market",
      imageUrl: "/images/market.png",
      sortOrder: 4,
    },
    {
      tag: null,
      title: "기업 웰컴 키트",
      subtitle: "브랜드 맞춤",
      linkUrl: "/ideas/welcome-kit",
      imageUrl: "/images/company.png",
      sortOrder: 5,
    },
    {
      tag: null,
      title: "팬미팅 굿즈",
      subtitle: "최애 굿즈 제작",
      linkUrl: "/ideas/fan-meeting",
      imageUrl: "/images/goods.png",
      sortOrder: 6,
    },
    {
      tag: null,
      title: "카페 오픈 기념",
      subtitle: "에코백 + 파우치",
      linkUrl: "/ideas/cafe-opening",
      imageUrl: "/images/coffee.png",
      sortOrder: 7,
    },
  ];
  await prisma.banner.deleteMany({ where: { placement: "HOME_IDEA" } });
  for (const b of ideaBanners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_IDEA", isActive: true },
    });
  }

  const guideBanners = [
    {
      tag: null,
      title: "에코백 제작 완벽 가이드",
      subtitle: "사이즈·원단·인쇄면 선택부터 제작 주의사항까지",
      linkUrl: "/guides/ecobag-guide",
      imageUrl: null,
      sortOrder: 0,
    },
    {
      tag: null,
      title: "F&B 브랜드 굿즈 제작 사례",
      subtitle: "카페·베이커리 에코백 제작 사례와 수량별 가격",
      linkUrl: "/guides/fnb-goods",
      imageUrl: null,
      sortOrder: 1,
    },
    {
      tag: null,
      title: "단체 행사 장바구니 제작",
      subtitle: "마켓·축제용 장바구니 1개부터 대량 제작",
      linkUrl: "/guides/event-shopping-bag",
      imageUrl: null,
      sortOrder: 2,
    },
    {
      tag: null,
      title: "이미지 해상도 가이드",
      subtitle: "선명한 인쇄를 위한 이미지 준비 꿀팁",
      linkUrl: "/guides/print-resolution",
      imageUrl: null,
      sortOrder: 3,
    },
  ];
  await prisma.banner.deleteMany({ where: { placement: "HOME_GUIDE" } });
  for (const b of guideBanners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_GUIDE", isActive: true },
    });
  }

  // ── 소개글 (가이드 · 상황별 굿즈) ──
  const contentArticles = [
    ...defaultGuidePayloads(),
    ...DEFAULT_IDEA_ARTICLES,
  ];
  for (const payload of contentArticles) {
    const data = toPrismaCreateData(payload);
    await prisma.contentArticle.upsert({
      where: { slug: data.slug },
      create: data,
      update: {
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        coverImageUrl: data.coverImageUrl,
        cardTag: data.cardTag,
        cardGradient: data.cardGradient,
        introJson: data.introJson,
        sectionsJson: data.sectionsJson,
        faqJson: data.faqJson,
        publishedAt: data.publishedAt,
        sortOrder: data.sortOrder,
        isActive: true,
      },
    });
  }

  // ── 2분컷 템플릿 ──
  const templates = [
    {
      productSlug: "canvas-tote-illustration",
      title: "문구만 바꾸면 완성! 사각 에코백 만들기",
      description: "에코백에 텍스트를 넣어 2분 만에 제작해 보세요.",
      sortOrder: 0,
    },
    {
      productSlug: "canvas-cross-strap",
      title: "로고·이미지 업로드! 장바구니 만들기",
      description: "PNG, JPG를 올려 나만의 굿즈를 완성하세요.",
      sortOrder: 1,
    },
  ];

  await prisma.designTemplate.deleteMany({});
  for (const tpl of templates) {
    await prisma.designTemplate.create({
      data: {
        productId: products[tpl.productSlug].id,
        title: tpl.title,
        description: tpl.description,
        sortOrder: tpl.sortOrder,
      },
    });
  }

  // ── 상품 상세 섹션 (마플 스타일 하단 콘텐츠) ──
  const detailSectionDefs: Array<{
    slug: string;
    type: "STORY" | "INFO" | "GUIDE" | "SIZE" | "FAQ" | "SHIPPING" | "CAUTION";
    title: string;
    body: string;
    sortOrder: number;
  }> = [
    {
      slug: "ecobag",
      type: "STORY",
      title: "나만의 에코백, 손쉽게 완성",
      body: "캔버스·면 원단 에코백에 로고와 문구를 담아 보세요.\n브랜드 굿즈, 팬 굿즈, 행사 기념품까지 1개부터 제작할 수 있어요.\n앞·뒤·측면 인쇄로 나만의 디자인을 자유롭게 표현해 보세요.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "STORY",
      title: "3분이면 나만의 굿즈 완성",
      body: "어렵지 않아요!\n원하는 면을 선택하고 이미지·텍스트를 배치한 뒤 주문만 하면 됩니다.\n수량별 할인으로 대량 제작도 부담 없이 진행할 수 있어요.",
      sortOrder: 1,
    },
    {
      slug: "ecobag",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 본품 1개\n• 제조국: Made in Korea\n• 소재: 면·캔버스 혼방\n• 인쇄: 전사 인쇄 (앞·뒤·측면)\n• 최소 주문: 1개\n• 평균 제작 기간: 주문 후 3~5영업일",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | S | M | L |\n| --- | --- | --- | --- |\n| 가로 (cm) | 28 | 32 | 38 |\n| 세로 (cm) | 30 | 34 | 40 |\n| 손잡이 (cm) | 25 | 28 | 30 |",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "GUIDE",
      title: "디자인 파일 준비",
      body: "• PNG, JPG 파일을 업로드할 수 있어요.\n• 인쇄 영역에 맞게 2,000px 이상 해상도를 권장합니다.\n• 작은 원본을 무리하게 확대하면 인쇄 시 화질이 깨질 수 있어요.\n• 흰색 배경·흰색 글자는 원단 색과 겹쳐 인쇄가 잘 보이지 않을 수 있습니다.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "GUIDE",
      title: "인쇄 유의 사항",
      body: "• 모니터·기기에 따라 실제 인쇄 색상과 차이가 있을 수 있습니다.\n• 원단 특성상 색감이 약간 연하게 표현될 수 있으니 보정 후 업로드하세요.\n• 인쇄 위치·크기는 수작업 특성상 ±5mm 오차가 발생할 수 있습니다.",
      sortOrder: 1,
    },
    {
      slug: "ecobag",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "저작권이 있는 이미지를 사용할 수 있나요?",
          a: "저작권자의 허락이 있거나, 본인이 직접 제작한 이미지·공개 라이선스 이미지만 사용 가능합니다.",
        },
        {
          q: "배경 제거가 가능한가요?",
          a: "주문 시 작업 요청란에 배경 제거를 요청해 주시면 검토 후 안내드립니다.",
        },
        {
          q: "대량 주문 시 할인이 있나요?",
          a: "수량별 할인표를 확인해 주세요. 100개·500개 이상 구간에서 단가가 내려갑니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 100% 주문 제작 상품으로, 결제 완료 후 제작이 시작됩니다.\n• 평균 제작 기간: 3~5영업일 (대량 주문 시 7~10영업일)\n• 출고 후 택배 수령: 영업일 기준 1~2일\n• 배송비: 3,000원 (5만원 이상 무료배송 예정)\n• 제작 준비 중 상태에서만 주문 변경·취소가 가능합니다.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "CAUTION",
      title: "주의사항",
      body: "• 주문 제작 상품은 단순 변심 교환·환불이 제한될 수 있습니다.\n• 디자인 시안과 실제 인쇄 색상·위치 차이는 교환 사유에 해당하지 않을 수 있습니다.\n• 세탁 시 단독 손세탁을 권장하며, 직사광선·고온 건조는 피해 주세요.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "STORY",
      title: "행사·마켓에 딱 맞는 장바구니",
      body: "플리마켓, 축제, 기업 행사에 어울리는 장바구니입니다.\n로고와 슬로건을 담아 브랜드 홍보와 실용성을 동시에 챙겨 보세요.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 본품 1개\n• 제조국: Made in Korea\n• 소재: 폴리에스테르\n• 인쇄: 전사 인쇄\n• 최소 주문: 1개",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | ONE |\n| --- | --- |\n| 가로 (cm) | 35 |\n| 세로 (cm) | 40 |\n| 손잡이 (cm) | 30 |",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "GUIDE",
      title: "제작 가이드",
      body: "• 로고는 PNG(투명 배경) 업로드를 권장합니다.\n• 텍스트는 굵은 서체가 인쇄 후 가독성이 좋습니다.\n• 양면 다른 디자인도 가능합니다.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "몇 개부터 주문할 수 있나요?",
          a: "1개부터 주문 가능하며, 대량 주문 시 별도 견적을 요청하실 수 있습니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 제작 완료 후 순차 출고됩니다.\n• 대량 주문은 제작 일정을 사전에 안내드립니다.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "STORY",
      title: "손안에 쏙, 나만의 파우치",
      body: "팬미팅·이벤트 굿즈로 인기 있는 지퍼형 파우치입니다.\n3면 인쇄로 캐릭터와 문구를 담아 보세요.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 지퍼 파우치 1개\n• 소재: 폴리에스테르\n• 인쇄: 전사 인쇄 (앞·뒤·측면)",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | ONE |\n| --- | --- |\n| 가로 (cm) | 18 |\n| 세로 (cm) | 12 |",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "GUIDE",
      title: "제작 가이드",
      body: "• 작은 인쇄 영역이므로 단순한 로고·짧은 문구가 잘 어울립니다.\n• 고해상도 이미지를 권장합니다.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "지퍼 색상을 선택할 수 있나요?",
          a: "현재 기본 색상으로 제공되며, 추후 옵션 확대 예정입니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 소형 상품으로 빠른 제작·출고가 가능합니다.\n• 평균 3~5영업일 내 출고됩니다.",
      sortOrder: 0,
    },
  ];

  for (const slug of Object.keys(products)) {
    // 기성품은 상세 섹션 시드 생략
    const isReady = readyMadeDefs.some((r) => r.slug === slug);
    if (isReady) continue;
    await prisma.productDetailSection.deleteMany({
      where: { productId: products[slug].id },
    });
  }

  for (const sec of detailSectionDefs) {
    const product = products[sec.slug];
    if (!product) continue;
    await prisma.productDetailSection.create({
      data: {
        productId: product.id,
        type: sec.type,
        title: sec.title,
        body: sec.body,
        sortOrder: sec.sortOrder,
      },
    });
  }

  // 커스텀 변형 상품에 기준 상품 상세 섹션 복제
  for (const p of productDefs) {
    const sourceSlug = mockupSourceByType[p.builderType];
    if (!sourceSlug || p.slug === sourceSlug) continue;
    const sourceId = products[sourceSlug]?.id;
    const targetId = products[p.slug]?.id;
    if (!sourceId || !targetId) continue;
    const existing = await prisma.productDetailSection.count({
      where: { productId: targetId },
    });
    if (existing > 0) continue;
    const sourceSecs = await prisma.productDetailSection.findMany({
      where: { productId: sourceId },
    });
    if (sourceSecs.length === 0) continue;
    await prisma.productDetailSection.createMany({
      data: sourceSecs.map((s) => ({
        productId: targetId,
        type: s.type,
        title: s.title,
        body: s.body,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder,
      })),
    });
  }

  // ── 상품 리뷰 샘플 ──
  const customer = await prisma.user.findUnique({
    where: { email: "customer@hmaker.com" },
  });
  if (customer) {
    const reviewSamples = [
      {
        slug: "ecobag",
        rating: 5,
        content:
          "색감이 예쁘게 나왔고 배송도 빨라서 만족합니다. 대량 주문도 문의했는데 친절하게 안내해 주셨어요!",
        isHot: true,
      },
      {
        slug: "ecobag",
        rating: 5,
        content: "로고 위치 걱정했는데 생각보다 깔끔하게 잘 나왔습니다. 재주문 의사 있어요.",
        isHot: false,
      },
      {
        slug: "shopping-bag",
        rating: 5,
        content: "행사용으로 200개 주문했는데 퀄리티 좋고 가격도 합리적이었습니다.",
        isHot: true,
      },
      {
        slug: "pouch",
        rating: 4,
        content: "귀엽게 잘 나왔어요. 인쇄 색은 조금 연하게 나오니 보정해서 올리시면 좋을 것 같아요.",
        isHot: false,
      },
    ];

    for (const rev of reviewSamples) {
      const product = products[rev.slug];
      if (!product) continue;
      const productId = product.id;
      const exists = await prisma.productReview.findFirst({
        where: { productId, userId: customer.id, content: rev.content },
      });
      if (!exists) {
        await prisma.productReview.create({
          data: {
            productId,
            userId: customer.id,
            rating: rev.rating,
            content: rev.content,
            isHot: rev.isHot,
          },
        });
      }
    }

    for (const slug of Object.keys(products)) {
      const agg = await prisma.productReview.aggregate({
        where: { productId: products[slug].id, isVisible: true },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.product.update({
        where: { id: products[slug].id },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          reviewCount: agg._count,
        },
      });
    }
  }

  // ── 계정 ──
  await prisma.user.deleteMany({
    where: {
      email: { in: ["admin@jhmaker.com", "customer@jhmaker.com"] },
    },
  });

  for (const account of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, passwordHash, role: account.role },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
      },
    });
  }

  console.log("");
  console.log("=== 시드 완료 ===");
  console.log(
    "카테고리, 상품, 컬렉션, 배너, 소개글, 할인규칙, 템플릿, 계정",
  );
  for (const a of ACCOUNTS) {
    console.log(`[${a.role}] ${a.email} / ${a.password}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
