import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyReservationRestaurantOwnership } from "@/lib/api-middleware";
import { ReservationStatus } from "@prisma/client";

export const POST = withOwner<{ id: string }>(async (req, session, { params }) => {
  const { id } = await params;
  const form = await req.formData();
  const status = form.get("status");

  // Validate status
  if (status !== "CONFIRMED" && status !== "CANCELLED" && status !== "EDITED") {
    return NextResponse.redirect(
      new URL(req.headers.get("referer") || "/", req.url)
    );
  }

  // Verify the reservation belongs to one of the owner's restaurants
  const isOwner = await verifyReservationRestaurantOwnership(
    id,
    session.user.email
  );

  if (!isOwner) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: status as ReservationStatus },
  });

  return NextResponse.redirect(
    new URL(req.headers.get("referer") || "/", req.url)
  );
});
