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

const optionSchema = {
  sizes: ["S", "M", "L"],
  fabrics: ["canvas"],
  colors: ["cream", "white", "ivory", "beige"],
};

const productDefs = [
  {
    slug: "4color-canvas-zipper-pouch",
    name: "4색 캔버스 지퍼 파우치",
    shortDesc: "컬러 캔버스 지퍼 파우치",
    description:
      "여러 색상으로 고를 수 있는 캔버스 지퍼 파우치입니다. 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 1,
    thumbnailUrl: "/mockups/01_TOVE_pink_front.png",
    faces: [
      mockupFace(
        "front",
        "/mockups/01_TOVE_pink_front.png",
        900,
        900,
        0.18,
        0.32,
        0.64,
        0.42,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/01_TOVE_pink_back.png",
        900,
        900,
        0.18,
        0.32,
        0.64,
        0.42,
        1,
      ),
    ],
  },
  {
    slug: "webbing-tyvek-vertical-zipper-bag",
    name: "웨빙손잡이 세로형 타이벡 지퍼백",
    shortDesc: "웨빙 손잡이 타이벡 세로 지퍼백",
    description:
      "웨빙 손잡이가 달린 세로형 타이벡 지퍼백입니다. 가볍고 내구성이 좋으며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 2,
    thumbnailUrl: "/mockups/02_white_black_handle_front.png",
    faces: [
      mockupFace(
        "front",
        "/mockups/02_white_black_handle_front.png",
        900,
        900,
        0.28,
        0.34,
        0.44,
        0.42,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/02_white_black_handle_back.png",
        900,
        900,
        0.28,
        0.34,
        0.44,
        0.42,
        1,
      ),
    ],
  },
  {
    slug: "blue-zipper-graphic-canvas-pouch",
    name: "파란 지퍼·그래픽 캔버스 파우치",
    shortDesc: "파란 지퍼가 포인트인 캔버스 파우치",
    description:
      "파란 지퍼가 포인트인 캔버스 파우치입니다. 그래픽·로고 인쇄에 적합하고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 3,
    thumbnailUrl: "/mockups/03_blue_graphic_white_front.png",
    faces: [
      mockupFace(
        "front",
        "/mockups/03_blue_graphic_white_front.png",
        900,
        900,
        0.2,
        0.3,
        0.6,
        0.44,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/03_blue_graphic_white_back.png",
        900,
        900,
        0.2,
        0.3,
        0.6,
        0.44,
        1,
      ),
    ],
  },
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "zipper-pouch" },
    update: {
      name: "지퍼파우치",
      sortOrder: 4,
      isActive: true,
    },
    create: {
      slug: "zipper-pouch",
      name: "지퍼파우치",
      sortOrder: 4,
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
        basePrice: 0,
        sortOrder: data.sortOrder,
        isFeatured: true,
        isNew: true,
        categoryId: category.id,
        builderType: "pouch",
        saleType: "CUSTOM",
        optionSchema,
        thumbnailUrl: data.thumbnailUrl,
        isActive: true,
        stockQuantity: null,
      },
      create: {
        slug: p.slug,
        name: data.name,
        shortDesc: data.shortDesc,
        description: data.description,
        basePrice: 0,
        sortOrder: data.sortOrder,
        isFeatured: true,
        isNew: true,
        categoryId: category.id,
        builderType: "pouch",
        saleType: "CUSTOM",
        optionSchema,
        thumbnailUrl: data.thumbnailUrl,
        isActive: true,
        stockQuantity: null,
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

    console.log(
      "upsert",
      p.slug,
      "→",
      faces.map((f) => f.imageUrl).join(", "),
    );
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
