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
    slug: "raw-20s-flap-dust-bag",
    name: "20수 생지 덮개형 더스트백",
    shortDesc: "20수 생지 덮개형 플랫 더스트백",
    description:
      "20수 생지로 만든 덮개형 더스트백입니다. 플랩으로 입구를 가릴 수 있고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 1,
    thumbnailUrl: "/mockups/0001.png",
    faces: [
      mockupFace("front", "/mockups/0001.png", 1254, 1254, 0.26, 0.36, 0.48, 0.42, 0),
      mockupFace("back", "/mockups/0002.png", 1254, 1254, 0.26, 0.34, 0.48, 0.44, 1),
    ],
  },
  {
    slug: "raw-20s-rib-loop-sachet",
    name: "20수 생지 골직 고리 샤쉐 파우치",
    shortDesc: "골직 고리가 달린 생지 샤쉐 파우치",
    description:
      "20수 생지에 골직 고리를 단 샤쉐 파우치입니다. 걸거나 걸쇠에 끼워 쓰기 좋고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 2,
    thumbnailUrl: "/mockups/0003.png",
    faces: [
      mockupFace("front", "/mockups/0003.png", 1254, 1254, 0.28, 0.38, 0.44, 0.4, 0),
      mockupFace("back", "/mockups/0004.png", 1254, 1254, 0.28, 0.38, 0.44, 0.4, 1),
    ],
  },
  {
    slug: "nonwoven-ultrasonic-flap-dust-bag",
    name: "부직포 초음파 덮개형 더스트백",
    shortDesc: "초음파 접합 부직포 덮개형 더스트백",
    description:
      "부직포를 초음파로 접합한 덮개형 더스트백입니다. 가볍고 대량 제작에 적합하며, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 3,
    thumbnailUrl: "/mockups/0005.png",
    faces: [
      mockupFace("front", "/mockups/0005.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 0),
      mockupFace("back", "/mockups/0006.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 1),
    ],
  },
  {
    slug: "foldable-nonwoven-flat-dust-bag",
    name: "접이식 부직포 플랫 더스트백",
    shortDesc: "접어 보관하기 쉬운 부직포 플랫 더스트백",
    description:
      "접어서 보관하기 쉬운 부직포 플랫 더스트백입니다. 포장·보관용으로 쓰기 좋고, 앞면·뒷면에 디자인을 올릴 수 있습니다.",
    sortOrder: 4,
    thumbnailUrl: "/mockups/0007.png",
    faces: [
      mockupFace("front", "/mockups/0007.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 0),
      mockupFace("back", "/mockups/0008.png", 1254, 1254, 0.24, 0.34, 0.52, 0.42, 1),
    ],
  },
];

async function main() {
  const category = await prisma.category.upsert({
    where: { slug: "flat-dust-bag" },
    update: {
      name: "덮개형·플랫 더스트백",
      sortOrder: 3,
      isActive: true,
    },
    create: {
      slug: "flat-dust-bag",
      name: "덮개형·플랫 더스트백",
      sortOrder: 3,
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
