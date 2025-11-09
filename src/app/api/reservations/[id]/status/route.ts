import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyReservationRestaurantOwnership } from "@/lib/api-middleware";
import { ReservationStatus } from "@prisma/client";

export const POST = withOwner(async (req, session, { params }) => {
  const form = await req.formData();
  const status = form.get("status");

  // Validate status
  if (status !== "CONFIRMED" && status !== "CANCELLED") {
    return NextResponse.redirect(
      new URL(req.headers.get("referer") || "/", req.url)
    );
  }

  // Verify the reservation belongs to one of the owner's restaurants
  const isOwner = await verifyReservationRestaurantOwnership(
    params.id,
    session.user.email
  );

  if (!isOwner) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await prisma.reservation.update({
    where: { id: params.id },
    data: { status: status as ReservationStatus },
  });

  return NextResponse.redirect(
    new URL(req.headers.get("referer") || "/", req.url)
  );
});
