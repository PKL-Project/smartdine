import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JWT } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();
  if (role !== "OWNER" && role !== "DINER") {
    return NextResponse.json({ error: "Bad role" }, { status: 400 });
  }

  console.log("patryk role set", role);

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { role },
    select: { id: true },
  });

  // Nudge JWT to refresh on next request (client will reload page anyway)
  return NextResponse.json({ ok: true, userId: user.id });
}
