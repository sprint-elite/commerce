import { PrismaClient } from "@prisma/client";

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

const pouchOptionSchema = {
  sizes: ["S", "M", "L"],
  fabrics: ["canvas"],
  colors: ["cream", "white", "ivory", "beige"],
};

const productDefs = [
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
    faces: [
      mockupFace(
        "front",
        "/mockups/30_pouch_front.png",
        1122,
        1402,
        0.34,
        0.4,
        0.32,
        0.38,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/30_pouch_back.png",
        1122,
        1402,
        0.34,
        0.4,
        0.32,
        0.38,
        1,
      ),
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
    faces: [
      mockupFace(
        "front",
        "/mockups/160160_front.png",
        1254,
        1254,
        0.28,
        0.36,
        0.44,
        0.4,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/160160_back.png",
        1254,
        1254,
        0.28,
        0.36,
        0.44,
        0.4,
        1,
      ),
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
    faces: [
      mockupFace(
        "front",
        "/mockups/drawstring_front.png",
        1279,
        1230,
        0.26,
        0.34,
        0.48,
        0.42,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/drawstring_back.png",
        1395,
        1127,
        0.28,
        0.3,
        0.44,
        0.42,
        1,
      ),
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
    faces: [
      mockupFace(
        "front",
        "/mockups/20_mini_front.png",
        1254,
        1254,
        0.28,
        0.38,
        0.44,
        0.38,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/20_mini_back.png",
        1254,
        1254,
        0.28,
        0.38,
        0.44,
        0.38,
        1,
      ),
    ],
  },
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "drawstring-pouch" },
    update: {
      name: "조리개 파우치·더스트백",
      sortOrder: 2,
      isActive: true,
    },
    create: {
      slug: "drawstring-pouch",
      name: "조리개 파우치·더스트백",
      sortOrder: 2,
      isActive: true,
    },
  });

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
        categoryId: category.id,
        builderType: data.builderType,
        saleType: "CUSTOM",
        optionSchema: pouchOptionSchema,
        thumbnailUrl: data.thumbnailUrl,
        isActive: true,
        stockQuantity: null,
      },
      create: {
        ...data,
        categoryId: category.id,
        saleType: "CUSTOM",
        optionSchema: pouchOptionSchema,
      },
    });

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

    console.log("upsert", p.slug, "→", data.thumbnailUrl);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
