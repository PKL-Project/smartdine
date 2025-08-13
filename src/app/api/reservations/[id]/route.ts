import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: {
      restaurant: { select: { name: true, slug: true } },
      preorderItems: { include: { menuItem: true } },
    },
  });

  if (!reservation)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reservation);
}
