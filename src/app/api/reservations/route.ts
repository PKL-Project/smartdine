import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, getUserByEmail, ErrorResponses } from "@/lib/api-middleware";

interface PreorderItem {
  menuItemId: string;
  quantity?: number;
  note?: string;
}

interface CreateReservationBody {
  restaurantId?: string;
  startTime?: string;
  durationMinutes?: number;
  partySize?: number;
  tableId?: string;
  specialRequests?: string;
  preorderItems?: PreorderItem[];
}

export const POST = withAuth(async (req, session) => {
  const body: CreateReservationBody = await req.json();
  const {
    restaurantId,
    startTime,
    durationMinutes = 90,
    partySize,
    tableId,
    specialRequests,
    preorderItems,
  } = body;

  if (!restaurantId || !startTime || !partySize) {
    return ErrorResponses.badRequest(
      "Missing required fields: restaurantId, startTime, partySize"
    );
  }

  // Minimal conflict check: if tableId provided, ensure no overlap
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
      return ErrorResponses.conflict(
        "Time slot not available for selected table"
      );
    }
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return ErrorResponses.unauthorized();
  }

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
            create: preorderItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: Math.max(1, Number(item.quantity || 1)),
              note: item.note ?? null,
            })),
          }
        : undefined,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json(reservation);
});
