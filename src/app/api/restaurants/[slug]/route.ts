import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      owner: { select: { email: true } },
      categories: {
        include: {
          items: { where: { isAvailable: true }, orderBy: { name: "asc" } },
        },
        orderBy: { sort: "asc" },
      },
      tables: { orderBy: { capacity: "asc" } },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return NextResponse.json(restaurant);
}
