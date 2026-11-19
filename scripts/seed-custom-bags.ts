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
  colors: ["cream", "white", "ivory", "beige", "black"],
};

const productDefs = [
  {
    slug: "corner-reinforced-black-poly-drawstring-backpack",
    name: "모서리 보강 블랙 폴리 조리개 백팩",
    shortDesc: "모서리 보강 블랙 폴리 조리개 백팩",
    description:
      "모서리를 보강한 블랙 폴리 소재 조리개 백팩입니다. 가볍고 내구성이 좋으며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 1,
    thumbnailUrl: "/mockups/black_front_fixed.png",
    faces: [
      mockupFace(
        "front",
        "/mockups/black_front_fixed.png",
        708,
        710,
        0.28,
        0.32,
        0.44,
        0.42,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/black_back_fixed.png",
        708,
        710,
        0.28,
        0.32,
        0.44,
        0.42,
        1,
      ),
    ],
  },
  {
    slug: "print-strap-tyvek-drawstring-backpack",
    name: "인쇄 스트랩 타이벡 조리개 배낭",
    shortDesc: "인쇄 스트랩 타이벡 조리개 배낭",
    description:
      "스트랩에 인쇄가 가능한 타이벡 조리개 배낭입니다. 가볍고 접어 보관하기 좋으며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 2,
    thumbnailUrl: "/mockups/white_front.png",
    faces: [
      mockupFace(
        "front",
        "/mockups/white_front.png",
        900,
        900,
        0.28,
        0.32,
        0.44,
        0.42,
        0,
      ),
      mockupFace(
        "back",
        "/mockups/white_back.png",
        900,
        900,
        0.28,
        0.32,
        0.44,
        0.42,
        1,
      ),
    ],
  },
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "custom-bags" },
    update: {
      name: "기타가방·특수제작",
      sortOrder: 6,
      isActive: true,
    },
    create: {
      slug: "custom-bags",
      name: "기타가방·특수제작",
      sortOrder: 6,
      isActive: true,
    },
  });

  for (const p of productDefs) {
    const { faces, ...data } = p;

    // 실제 이미지 크기 반영
    const dims = faces.map((f) => {
      const buf = require("fs").readFileSync(
        `public${f.imageUrl}`,
      ) as Buffer;
      return {
        ...f,
        imageWidth: buf.readUInt32BE(16),
        imageHeight: buf.readUInt32BE(20),
      };
    });

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
      data: dims.map((face) => ({ productId: row.id, ...face })),
    });
    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.createMany({
      data: dims.map((face) => ({
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
      dims.map((f) => `${f.imageUrl}(${f.imageWidth}x${f.imageHeight})`).join(", "),
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
