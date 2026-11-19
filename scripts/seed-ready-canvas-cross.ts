import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findUnique({
    where: { slug: "ecobag-tote" },
  });
  if (!category) {
    throw new Error("카테고리 ecobag-tote 를 찾을 수 없습니다.");
  }

  const slug = "ready-canvas-cross-strap";
  const name = "길이 조절 스트랩 캔버스 크로스백";
  const front = "/mockups/tote_front-removebg-preview.png";
  const back = "/mockups/tote_back-removebg-preview.png";

  const row = await prisma.product.upsert({
    where: { slug },
    update: {
      name,
      shortDesc: "바로 구매 가능한 길이 조절 스트랩 캔버스 크로스백",
      description:
        "어깨에 메는 길이 조절 스트랩과 손잡이가 함께 있는 캔버스 크로스백 기성품입니다. 무인쇄 기본 상태로 바로 구매할 수 있습니다.",
      basePrice: 12900,
      minQuantity: 1,
      maxQuantity: 200,
      sortOrder: 10,
      isFeatured: true,
      isNew: true,
      isActive: true,
      categoryId: category.id,
      builderType: "ecobag",
      saleType: "READYMADE",
      thumbnailUrl: front,
      stockQuantity: 50,
      optionSchema: {
        sizes: ["M"],
        fabrics: ["canvas"],
        colors: ["cream"],
      },
    },
    create: {
      slug,
      name,
      shortDesc: "바로 구매 가능한 길이 조절 스트랩 캔버스 크로스백",
      description:
        "어깨에 메는 길이 조절 스트랩과 손잡이가 함께 있는 캔버스 크로스백 기성품입니다. 무인쇄 기본 상태로 바로 구매할 수 있습니다.",
      basePrice: 12900,
      minQuantity: 1,
      maxQuantity: 200,
      sortOrder: 10,
      isFeatured: true,
      isNew: true,
      isActive: true,
      categoryId: category.id,
      builderType: "ecobag",
      saleType: "READYMADE",
      thumbnailUrl: front,
      stockQuantity: 50,
      optionSchema: {
        sizes: ["M"],
        fabrics: ["canvas"],
        colors: ["cream"],
      },
    },
  });

  await prisma.productImage.deleteMany({ where: { productId: row.id } });
  await prisma.productImage.createMany({
    data: [
      {
        productId: row.id,
        url: front,
        alt: `${name} 앞면`,
        sortOrder: 0,
        isPrimary: true,
      },
      {
        productId: row.id,
        url: back,
        alt: `${name} 뒷면`,
        sortOrder: 1,
        isPrimary: false,
      },
    ],
  });

  console.log(`READYMADE product upserted: ${row.slug} (${row.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
