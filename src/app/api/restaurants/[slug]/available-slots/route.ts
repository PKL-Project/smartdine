import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const partySizeStr = searchParams.get("partySize");

  if (!dateStr || !partySizeStr) {
    return NextResponse.json(
      { error: "Missing date or partySize parameter" },
      { status: 400 }
    );
  }

  const partySize = parseInt(partySizeStr, 10);
  const requestedDate = new Date(dateStr);
  const weekday = requestedDate.getDay(); // 0=Sunday, 6=Saturday

  // Fetch restaurant with configuration
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      hours: {
        where: { weekday },
      },
      timeSlots: {
        orderBy: { startMinutes: 'asc' },
      },
      tables: {
        where: { capacity: { gte: partySize } },
        orderBy: { capacity: 'asc' },
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

  const openingHour = restaurant.hours[0];

  // Get all confirmed reservations for this date
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

  // Helper function to check if a table is available for a time range
  function isTableAvailable(tableId: string, start: Date, end: Date): boolean {
    return !confirmedReservations.some((reservation) => {
      if (reservation.tableId !== tableId) return false;

      const resStart = reservation.startTime;
      const resEnd = new Date(resStart.getTime() + reservation.durationMinutes * 60000);

      // Check for overlap
      return start < resEnd && end > resStart;
    });
  }

  // Calculate available slots
  const availableSlots: Array<{
    slotIndex: number;
    startTime: string;
    endTime: string;
    available: boolean;
  }> = [];

  for (let i = 0; i < restaurant.timeSlots.length; i++) {
    const slot = restaurant.timeSlots[i];

    // Calculate actual start time for this slot
    const slotStartMinutes = openingHour.openMinutes + slot.startMinutes;
    const slotDate = new Date(requestedDate);
    slotDate.setHours(Math.floor(slotStartMinutes / 60), slotStartMinutes % 60, 0, 0);

    const slotEndDate = new Date(slotDate.getTime() + slot.durationMinutes * 60000);

    // Check if any table is available for this slot
    let hasAvailableTable = false;

    for (const table of restaurant.tables) {
      if (isTableAvailable(table.id, slotDate, slotEndDate)) {
        hasAvailableTable = true;
        break;
      }
    }

    availableSlots.push({
      slotIndex: i,
      startTime: slotDate.toISOString(),
      endTime: slotEndDate.toISOString(),
      available: hasAvailableTable,
    });
  }

  return NextResponse.json({ availableSlots });
}
