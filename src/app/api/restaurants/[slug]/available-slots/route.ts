import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  const params = await context.params;
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const partySizeStr = searchParams.get("partySize");

  if (!dateStr || !partySizeStr) {
    return NextResponse.json({ error: "Missing date or partySize parameter" }, { status: 400 });
  }

  const partySize = parseInt(partySizeStr, 10);
  // Parse date string as local date (YYYY-MM-DD format)
  const [year, month, day] = dateStr.split("-").map(Number);
  const requestedDate = new Date(year, month - 1, day);
  const weekday = requestedDate.getDay(); // 0=Sunday, 6=Saturday

  // Fetch restaurant with configuration
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      hours: {
        where: { weekday },
      },
      timeSlots: {
        orderBy: { startMinutes: "asc" },
      },
      tables: {
        where: { capacity: { gte: partySize } },
        orderBy: { capacity: "asc" },
      },
    },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Check if restaurant is open on this day
  if (restaurant.hours.length === 0) {
    return NextResponse.json({ availableSlots: [] });
  }

  // No tables available for party size
  if (restaurant.tables.length === 0) {
    return NextResponse.json({ availableSlots: [] });
  }

  // Get all CONFIRMED reservations for this date
  // Only confirmed reservations block slots
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const confirmedReservations = await prisma.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      status: "CONFIRMED",
      startTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    select: {
      tableId: true,
      startTime: true,
      durationMinutes: true,
    },
  });

  // Calculate available slots
  const availableSlots: Array<{
    slotIndex: number;
    startTime: string;
    endTime: string;
    available: boolean;
    suggestedTable: { id: string; name: string; capacity: number } | null;
  }> = [];

  for (let i = 0; i < restaurant.timeSlots.length; i++) {
    const slot = restaurant.timeSlots[i];

    // Calculate actual start time for this slot
    const slotDate = new Date(requestedDate);
    slotDate.setHours(Math.floor(slot.startMinutes / 60), slot.startMinutes % 60, 0, 0);

    const slotEndDate = new Date(slotDate.getTime() + slot.durationMinutes * 60000);

    // Find which tables are booked for this slot
    const bookedTableIds = new Set<string>();
    for (const r of confirmedReservations) {
      if (!r.tableId) continue;
      const resStart = r.startTime;
      const resEnd = new Date(resStart.getTime() + r.durationMinutes * 60000);
      if (slotDate < resEnd && slotEndDate > resStart) {
        bookedTableIds.add(r.tableId);
      }
    }

    // Find the best available table (smallest that fits party size)
    // Tables are already ordered by capacity ascending
    const availableTable = restaurant.tables.find((t) => !bookedTableIds.has(t.id));

    availableSlots.push({
      slotIndex: i,
      startTime: slotDate.toISOString(),
      endTime: slotEndDate.toISOString(),
      available: !!availableTable,
      suggestedTable: availableTable
        ? {
            id: availableTable.id,
            name: availableTable.name,
            capacity: availableTable.capacity,
          }
        : null,
    });
  }

  return NextResponse.json({ availableSlots });
}
