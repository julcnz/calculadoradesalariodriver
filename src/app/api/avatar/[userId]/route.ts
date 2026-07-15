import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  const { userId } = await params;

  // Solo el dueño puede ver su avatar.
  if (!session?.user?.id || session.user.id !== userId) {
    return new NextResponse(null, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true, avatarMimeType: true },
  });
  if (!user?.avatar || !user.avatarMimeType) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(Buffer.from(user.avatar), {
    headers: {
      "Content-Type": user.avatarMimeType,
      // La URL lleva ?v=<timestamp>: puede cachearse fuerte.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
