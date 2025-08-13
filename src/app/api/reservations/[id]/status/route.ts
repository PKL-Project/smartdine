import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.redirect(new URL("/", req.url));
  if (session.user.role !== "OWNER")
    return NextResponse.redirect(new URL("/", req.url));

  const form = await req.formData();
  const status = form.get("status");
  if (status !== "CONFIRMED" && status !== "CANCELLED") {
    return NextResponse.redirect(
      new URL(req.headers.get("referer") || "/", req.url)
    );
  }

  // Ensure the reservation belongs to one of the owner's restaurants
  const res = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { restaurant: { include: { owner: true } } },
  });
  if (!res || res.restaurant.owner.email !== session.user.email) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  await prisma.reservation.update({
    where: { id: params.id },
    data: { status: status as any },
  });

  return NextResponse.redirect(
    new URL(req.headers.get("referer") || "/", req.url)
  );
}
