import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    restaurantId,
    startTime, // ISO string
    durationMinutes = 90,
    partySize,
    tableId, // optional
    specialRequests, // optional
    preorderItems, // optional: [{menuItemId, quantity, note?}]
  } = body ?? {};

  if (!restaurantId || !startTime || !partySize) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Minimal conflict check (naive): if tableId provided, ensure no overlap
  if (tableId) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const conflict = await prisma.reservation.findFirst({
      where: {
        tableId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [
          { startTime: { lt: end } },
          {
            startTime: {
              gt: new Date(start.getTime() - durationMinutes * 60000),
            },
          },
        ],
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Time slot not available for selected table" },
        { status: 409 }
      );
    }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 401 });

  const reservation = await prisma.reservation.create({
    data: {
      restaurantId,
      userId: user.id,
      tableId: tableId ?? null,
      startTime: new Date(startTime),
      durationMinutes,
      partySize,
      specialRequests: specialRequests ?? null,
      status: "PENDING",
      preorderItems: preorderItems?.length
        ? {
            create: preorderItems.map((it: any) => ({
              menuItemId: it.menuItemId,
              quantity: Math.max(1, Number(it.quantity || 1)),
              note: it.note ?? null,
            })),
          }
        : undefined,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(reservation);
}
